import { GitHubService } from '../services/github.service';
import { Env } from '../config/env';

// Mock Octokit
const mockOctokit = {
  repos: {
    getContent: jest.fn(),
    getBranch: jest.fn(),
    createOrUpdateFileContents: jest.fn(),
  },
  git: {
    createRef: jest.fn(),
    deleteRef: jest.fn(),
  },
  pulls: {
    create: jest.fn(),
  },
};

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => mockOctokit),
}));

describe('GitHubService', () => {
  let githubService: GitHubService;
  let mockEnv: Env;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    mockEnv = {
      GITHUB_TOKEN: 'test-token',
      GITHUB_REPO: 'test-owner/test-repo',
      GITHUB_BRANCH: 'main',
      GITHUB_TARGET_PATH: 'artifacts/texts.json',
      GITHUB_COMMIT_MESSAGE_TEMPLATE: 'Update {key} - {timestamp}',
      GITHUB_PR_TITLE_TEMPLATE: 'Update: {key}',
      GITHUB_PR_BODY_TEMPLATE: 'PR for {key}',
      PORT: '3000',
      NODE_ENV: 'test',
    };

    githubService = new GitHubService(mockEnv);
  });

  describe('getCurrentFile', () => {
    it('should return file content when file exists', async () => {
      const mockFileData = {
        data: {
          type: 'file',
          sha: 'abc123',
          content: Buffer.from('{"test": "content"}').toString('base64'),
        },
      };

      mockOctokit.repos.getContent.mockResolvedValue(mockFileData);

      const result = await githubService.getCurrentFile();

      expect(result).toEqual({
        sha: 'abc123',
        content: '{"test": "content"}',
      });
      expect(mockOctokit.repos.getContent).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        path: 'artifacts/texts.json',
        ref: 'main',
      });
    });

    it('should return null when file does not exist', async () => {
      const error = new Error('Not Found');
      (error as any).status = 404;
      mockOctokit.repos.getContent.mockRejectedValue(error);

      const result = await githubService.getCurrentFile();

      expect(result).toBeNull();
    });

    it('should throw error for other API errors', async () => {
      const error = new Error('API Error');
      mockOctokit.repos.getContent.mockRejectedValue(error);

      await expect(githubService.getCurrentFile()).rejects.toThrow('API Error');
    });
  });

  describe('createBranch', () => {
    it('should create a new branch from base branch', async () => {
      const mockBranchData = {
        data: {
          commit: {
            sha: 'def456',
          },
        },
      };

      mockOctokit.repos.getBranch.mockResolvedValue(mockBranchData);
      mockOctokit.git.createRef.mockResolvedValue({});

      await githubService.createBranch('feature-branch');

      expect(mockOctokit.repos.getBranch).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'main',
      });
      expect(mockOctokit.git.createRef).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        ref: 'refs/heads/feature-branch',
        sha: 'def456',
      });
    });
  });

  describe('commitFile', () => {
    it('should commit new file when no base SHA provided and file does not exist', async () => {
      jest.spyOn(githubService, 'getCurrentFile').mockResolvedValue(null);
      mockOctokit.repos.createOrUpdateFileContents.mockResolvedValue({});

      await githubService.commitFile(
        'feature-branch',
        'new content',
        'test message'
      );

      expect(mockOctokit.repos.createOrUpdateFileContents).toHaveBeenCalledWith(
        {
          owner: 'test-owner',
          repo: 'test-repo',
          path: 'artifacts/texts.json',
          message: 'test message',
          content: Buffer.from('new content').toString('base64'),
          branch: 'feature-branch',
        }
      );
    });

    it('should update existing file when base SHA provided', async () => {
      mockOctokit.repos.createOrUpdateFileContents.mockResolvedValue({});

      await githubService.commitFile(
        'feature-branch',
        'updated content',
        'test message',
        'abc123'
      );

      expect(mockOctokit.repos.createOrUpdateFileContents).toHaveBeenCalledWith(
        {
          owner: 'test-owner',
          repo: 'test-repo',
          path: 'artifacts/texts.json',
          message: 'test message',
          content: Buffer.from('updated content').toString('base64'),
          sha: 'abc123',
          branch: 'feature-branch',
        }
      );
    });

    it('should throw race condition error on SHA mismatch', async () => {
      const error = new Error('SHA does not match');
      mockOctokit.repos.createOrUpdateFileContents.mockRejectedValue(error);

      await expect(
        githubService.commitFile(
          'feature-branch',
          'content',
          'message',
          'abc123'
        )
      ).rejects.toThrow('RACE_CONDITION: File was modified by another process');
    });
  });

  describe('createPullRequest', () => {
    it('should create a pull request', async () => {
      const mockPR = {
        data: {
          html_url: 'https://github.com/test-owner/test-repo/pull/1',
        },
      };

      mockOctokit.pulls.create.mockResolvedValue(mockPR);

      const result = await githubService.createPullRequest(
        'feature-branch',
        'PR Title',
        'PR Body'
      );

      expect(result).toBe('https://github.com/test-owner/test-repo/pull/1');
      expect(mockOctokit.pulls.create).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'PR Title',
        body: 'PR Body',
        head: 'feature-branch',
        base: 'main',
      });
    });
  });

  describe('syncContent', () => {
    it('should return no changes when content is identical', async () => {
      jest.spyOn(githubService, 'getCurrentFile').mockResolvedValue({
        sha: 'abc123',
        content: 'same content',
      });

      const result = await githubService.syncContent(
        'test-key',
        'same content'
      );

      expect(result).toEqual({
        success: true,
        noChanges: true,
      });
    });

    it('should create PR when content differs', async () => {
      jest.spyOn(githubService, 'getCurrentFile').mockResolvedValue({
        sha: 'abc123',
        content: 'old content',
      });
      jest.spyOn(githubService, 'createBranch').mockResolvedValue();
      jest.spyOn(githubService, 'commitFile').mockResolvedValue();
      jest
        .spyOn(githubService, 'createPullRequest')
        .mockResolvedValue('pr-url');
      jest.spyOn(githubService, 'deleteBranch').mockResolvedValue();

      const result = await githubService.syncContent('test-key', 'new content');

      expect(result).toEqual({
        success: true,
        prUrl: 'pr-url',
      });
    });

    it('should handle race conditions with retry', async () => {
      jest.spyOn(githubService, 'getCurrentFile').mockResolvedValue({
        sha: 'abc123',
        content: 'old content',
      });
      jest.spyOn(githubService, 'createBranch').mockResolvedValue();

      // First attempt fails with race condition
      const raceError = new Error(
        'RACE_CONDITION: File was modified by another process'
      );
      jest
        .spyOn(githubService, 'commitFile')
        .mockRejectedValueOnce(raceError)
        .mockResolvedValueOnce(undefined);

      jest
        .spyOn(githubService, 'createPullRequest')
        .mockResolvedValue('pr-url');
      jest.spyOn(githubService, 'deleteBranch').mockResolvedValue();

      const result = await githubService.syncContent('test-key', 'new content');

      expect(result).toEqual({
        success: true,
        prUrl: 'pr-url',
      });
      expect(githubService.commitFile).toHaveBeenCalledTimes(2);
    });

    it('should fail after retry limit', async () => {
      jest.spyOn(githubService, 'getCurrentFile').mockResolvedValue({
        sha: 'abc123',
        content: 'old content',
      });
      jest.spyOn(githubService, 'createBranch').mockResolvedValue();

      const raceError = new Error(
        'RACE_CONDITION: File was modified by another process'
      );
      jest.spyOn(githubService, 'commitFile').mockRejectedValue(raceError);
      jest.spyOn(githubService, 'deleteBranch').mockResolvedValue();

      const result = await githubService.syncContent('test-key', 'new content');

      expect(result).toEqual({
        success: false,
        error: 'Failed due to race condition after retry',
      });
    });
  });

  describe('constructor', () => {
    it('should throw error when GitHub credentials are missing', () => {
      const invalidEnv = {
        ...mockEnv,
        GITHUB_TOKEN: undefined,
        GITHUB_REPO: undefined,
      };

      expect(() => new GitHubService(invalidEnv)).toThrow(
        'GitHub credentials not provided'
      );
    });
  });
});
