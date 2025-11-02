import { Octokit } from '@octokit/rest';
import { Env } from '../config/env';

export interface GitHubFileContent {
  sha: string;
  content: string;
}

export interface GitHubPRConfig {
  token: string;
  repo: string;
  branch: string;
  targetPath: string;
  commitMessageTemplate: string;
  prTitleTemplate: string;
  prBodyTemplate: string;
}

export interface CreatePRResult {
  success: boolean;
  prUrl?: string;
  error?: string;
  noChanges?: boolean;
}

export class GitHubService {
  private octokit: Octokit;
  private config: GitHubPRConfig;

  constructor(env: Env) {
    if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
      throw new Error('GitHub credentials not provided');
    }

    this.config = {
      token: env.GITHUB_TOKEN,
      repo: env.GITHUB_REPO,
      branch: env.GITHUB_BRANCH,
      targetPath: env.GITHUB_TARGET_PATH,
      commitMessageTemplate: env.GITHUB_COMMIT_MESSAGE_TEMPLATE,
      prTitleTemplate: env.GITHUB_PR_TITLE_TEMPLATE,
      prBodyTemplate: env.GITHUB_PR_BODY_TEMPLATE,
    };

    this.octokit = new Octokit({
      auth: this.config.token,
    });
  }

  /**
   * Get the current file content from GitHub
   */
  async getCurrentFile(): Promise<GitHubFileContent | null> {
    try {
      const [owner, repo] = this.config.repo.split('/');
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path: this.config.targetPath,
        ref: this.config.branch,
      });

      if (Array.isArray(response.data)) {
        throw new Error('Path points to a directory, not a file');
      }

      if (response.data.type !== 'file') {
        throw new Error('Path does not point to a file');
      }

      return {
        sha: response.data.sha,
        content: Buffer.from(response.data.content, 'base64').toString('utf-8'),
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Not Found')) {
        // File doesn't exist yet
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new branch from the base branch
   */
  async createBranch(branchName: string): Promise<void> {
    const [owner, repo] = this.config.repo.split('/');

    // Get the latest commit from base branch
    const baseBranch = await this.octokit.repos.getBranch({
      owner,
      repo,
      branch: this.config.branch,
    });

    // Create new branch
    await this.octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseBranch.data.commit.sha,
    });
  }

  /**
   * Commit changes to a file in a branch
   */
  async commitFile(
    branchName: string,
    content: string,
    message: string,
    baseSha?: string
  ): Promise<void> {
    const [owner, repo] = this.config.repo.split('/');

    try {
      // Get current file info if it exists
      let fileSha: string | undefined;
      if (baseSha) {
        fileSha = baseSha;
      } else {
        const currentFile = await this.getCurrentFile();
        fileSha = currentFile?.sha;
      }

      const contentEncoded = Buffer.from(content).toString('base64');

      if (fileSha) {
        // Update existing file
        await this.octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: this.config.targetPath,
          message,
          content: contentEncoded,
          sha: fileSha,
          branch: branchName,
        });
      } else {
        // Create new file
        await this.octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: this.config.targetPath,
          message,
          content: contentEncoded,
          branch: branchName,
        });
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('SHA does not match')
      ) {
        throw new Error('RACE_CONDITION: File was modified by another process');
      }
      throw error;
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    branchName: string,
    title: string,
    body: string
  ): Promise<string> {
    const [owner, repo] = this.config.repo.split('/');

    const pr = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head: branchName,
      base: this.config.branch,
    });

    return pr.data.html_url;
  }

  /**
   * Delete a branch
   */
  async deleteBranch(branchName: string): Promise<void> {
    const [owner, repo] = this.config.repo.split('/');

    await this.octokit.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
    });
  }

  /**
   * Main method to sync content and create PR if needed
   */
  async syncContent(
    key: string,
    newContent: string,
    retryCount: number = 0
  ): Promise<CreatePRResult> {
    const timestamp = new Date().toISOString();
    const branchName = `text-update-${key}-${Date.now()}`;

    try {
      // Get current file content
      const currentFile = await this.getCurrentFile();

      // Check if content is different
      if (currentFile && currentFile.content === newContent) {
        return {
          success: true,
          noChanges: true,
        };
      }

      // Create feature branch
      await this.createBranch(branchName);

      // Commit the new content
      const commitMessage = this.config.commitMessageTemplate
        .replace('{key}', key)
        .replace('{timestamp}', timestamp);

      await this.commitFile(
        branchName,
        newContent,
        commitMessage,
        currentFile?.sha
      );

      // Create pull request
      const prTitle = this.config.prTitleTemplate
        .replace('{key}', key)
        .replace('{timestamp}', timestamp);

      const prBody = this.config.prBodyTemplate
        .replace('{key}', key)
        .replace('{timestamp}', timestamp);

      const prUrl = await this.createPullRequest(branchName, prTitle, prBody);

      return {
        success: true,
        prUrl,
      };
    } catch (error) {
      // Clean up branch on error
      try {
        await this.deleteBranch(branchName);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      if (error instanceof Error && error.message.includes('RACE_CONDITION')) {
        // Retry once if we hit a race condition
        if (retryCount < 1) {
          return this.syncContent(key, newContent, retryCount + 1);
        }
        return {
          success: false,
          error: 'Failed due to race condition after retry',
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
