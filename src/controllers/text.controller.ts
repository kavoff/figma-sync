import { Request, Response } from 'express';
import { z } from 'zod';
import { TextService } from '../services/text.service';
import { GitHubService } from '../services/github.service';
import { validateEnv, isGitHubPRModeEnabled } from '../config/env';

const updateTextSchema = z.object({
  content: z.string().min(1),
  approvedBy: z.string().optional(),
});

export class TextController {
  private textService: TextService;
  private env = validateEnv();

  constructor() {
    this.textService = new TextService();
  }

  /**
   * GET /api/texts
   * Get all texts
   */
  async getTexts(req: Request, res: Response): Promise<void> {
    try {
      const texts = this.textService.getAllTexts();
      const metadata = this.textService.getMetadata();

      res.json({
        success: true,
        data: {
          ...metadata,
          texts,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve texts',
      });
    }
  }

  /**
   * GET /api/texts/:key
   * Get a specific text by key
   */
  async getText(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const text = this.textService.getText(key);

      if (!text) {
        res.status(404).json({
          success: false,
          error: 'Text not found',
        });
        return;
      }

      res.json({
        success: true,
        data: text,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve text',
      });
    }
  }

  /**
   * PUT /api/texts/:key
   * Update or create a text with approval
   */
  async updateText(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const validation = updateTextSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request body',
          details: validation.error.errors,
        });
        return;
      }

      const { content, approvedBy } = validation.data;

      // Update the text
      const updatedText = this.textService.updateText(key, content, approvedBy);

      // Generate the JSON artifact
      const artifactJson = this.textService.toJsonString();

      // If GitHub PR mode is enabled, sync to GitHub
      let githubResult = null;
      if (isGitHubPRModeEnabled(this.env)) {
        try {
          const githubService = new GitHubService(this.env);
          githubResult = await githubService.syncContent(key, artifactJson);
        } catch (githubError) {
          // Log GitHub error but don't fail the entire request
          console.error('GitHub sync failed:', githubError);
          githubResult = {
            success: false,
            error:
              githubError instanceof Error
                ? githubError.message
                : 'Unknown GitHub error',
          };
        }
      }

      const response: any = {
        success: true,
        data: {
          text: updatedText,
          artifact: this.textService.getMetadata(),
        },
      };

      // Add GitHub sync result if applicable
      if (githubResult) {
        response.githubSync = githubResult;
      }

      // If GitHub sync failed, return 207 Multi-Status to indicate partial success
      if (githubResult && !githubResult.success) {
        res.status(207).json(response);
        return;
      }

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update text',
      });
    }
  }

  /**
   * DELETE /api/texts/:key
   * Delete a text
   */
  async deleteText(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const deleted = this.textService.deleteText(key);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Text not found',
        });
        return;
      }

      // Generate the JSON artifact after deletion
      const artifactJson = this.textService.toJsonString();

      // If GitHub PR mode is enabled, sync to GitHub
      let githubResult = null;
      if (isGitHubPRModeEnabled(this.env)) {
        try {
          const githubService = new GitHubService(this.env);
          githubResult = await githubService.syncContent(key, artifactJson);
        } catch (githubError) {
          console.error('GitHub sync failed:', githubError);
          githubResult = {
            success: false,
            error:
              githubError instanceof Error
                ? githubError.message
                : 'Unknown GitHub error',
          };
        }
      }

      const response: any = {
        success: true,
        data: {
          deleted: true,
          artifact: this.textService.getMetadata(),
        },
      };

      if (githubResult) {
        response.githubSync = githubResult;
      }

      if (githubResult && !githubResult.success) {
        res.status(207).json(response);
        return;
      }

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete text',
      });
    }
  }
}
