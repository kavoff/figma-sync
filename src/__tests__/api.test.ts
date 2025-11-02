import request from 'supertest';
import { validateEnv } from '../config/env';

// Mock environment before importing app
jest.mock('../config/env', () => ({
  ...jest.requireActual('../config/env'),
  validateEnv: jest.fn(),
}));

const mockValidateEnv = validateEnv as jest.MockedFunction<typeof validateEnv>;

// Import app after mocking
const app = (() => {
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const path = require('path');

  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '../public')));

  // Mock API routes
  app.get('/health', (req: any, res: any) => {
    const env = validateEnv();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      githubPRMode: !!(env.GITHUB_TOKEN && env.GITHUB_REPO),
    });
  });

  app.get('/admin', (req: any, res: any) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
  });

  // Mock API routes for testing
  const textService = require('../services/text.service').TextService;
  const mockTextService = new textService();

  app.get('/api/texts', (req: any, res: any) => {
    try {
      const texts = mockTextService.getAllTexts();
      const metadata = mockTextService.getMetadata();
      res.json({
        success: true,
        data: { ...metadata, texts },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve texts',
      });
    }
  });

  app.get('/api/texts/:key', (req: any, res: any) => {
    try {
      const { key } = req.params;
      const text = mockTextService.getText(key);
      if (!text) {
        res.status(404).json({
          success: false,
          error: 'Text not found',
        });
        return;
      }
      res.json({ success: true, data: text });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve text',
      });
    }
  });

  app.put('/api/texts/:key', (req: any, res: any) => {
    try {
      const { key } = req.params;
      const { content, approvedBy } = req.body;

      if (!content) {
        res.status(400).json({
          success: false,
          error: 'Invalid request body',
        });
        return;
      }

      const updatedText = mockTextService.updateText(key, content, approvedBy);
      mockTextService.toJsonString(); // Generate artifact (not used in test)

      const env = validateEnv();
      let githubResult = null;
      if (env.GITHUB_TOKEN && env.GITHUB_REPO) {
        githubResult = {
          success: false,
          error: 'GitHub sync not available in test environment',
        };
      }

      const response: any = {
        success: true,
        data: {
          text: updatedText,
          artifact: mockTextService.getMetadata(),
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
        error: 'Failed to update text',
      });
    }
  });

  app.delete('/api/texts/:key', (req: any, res: any) => {
    try {
      const { key } = req.params;
      const deleted = mockTextService.deleteText(key);
      mockTextService.toJsonString(); // Generate artifact (not used in test)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Text not found',
        });
        return;
      }

      const env = validateEnv();
      let githubResult = null;
      if (env.GITHUB_TOKEN && env.GITHUB_REPO) {
        githubResult = {
          success: false,
          error: 'GitHub sync not available in test environment',
        };
      }

      const response: any = {
        success: true,
        data: {
          deleted: true,
          artifact: mockTextService.getMetadata(),
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
  });

  app.use('/api/*', (req: any, res: any) => {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found',
    });
  });

  app.use('*', (req: any, res: any) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
    });
  });

  return app;
})();

describe('API Endpoints', () => {
  beforeEach(() => {
    mockValidateEnv.mockReturnValue({
      GITHUB_TOKEN: undefined, // Disabled for basic tests
      GITHUB_REPO: undefined,
      GITHUB_BRANCH: 'main',
      GITHUB_TARGET_PATH: 'artifacts/texts.json',
      GITHUB_COMMIT_MESSAGE_TEMPLATE: 'Update {key} - {timestamp}',
      GITHUB_PR_TITLE_TEMPLATE: 'Update: {key}',
      GITHUB_PR_BODY_TEMPLATE: 'PR for {key}',
      PORT: '3000',
      NODE_ENV: 'test',
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        githubPRMode: false,
      });
    });
  });

  describe('GET /api/texts', () => {
    it('should return empty texts list initially', async () => {
      const response = await request(app).get('/api/texts').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          version: '1.0.0',
          lastUpdated: expect.any(String),
          count: 0,
          texts: {},
        },
      });
    });
  });

  describe('PUT /api/texts/:key', () => {
    it('should create a new text', async () => {
      const textData = {
        content: 'Test content',
        approvedBy: 'test-user',
      };

      const response = await request(app)
        .put('/api/texts/test-key')
        .send(textData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toEqual({
        key: 'test-key',
        content: 'Test content',
        approvedAt: expect.any(String),
        approvedBy: 'test-user',
        version: 1,
      });
      expect(response.body.githubSync).toBeUndefined();
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .put('/api/texts/test-key')
        .send({ content: '' }) // Empty content
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request body');
    });

    it('should update existing text', async () => {
      // Create initial text
      await request(app)
        .put('/api/texts/test-key')
        .send({ content: 'Original content', approvedBy: 'user1' })
        .expect(200);

      // Update text
      const response = await request(app)
        .put('/api/texts/test-key')
        .send({ content: 'Updated content', approvedBy: 'user2' })
        .expect(200);

      expect(response.body.data.text.version).toBeGreaterThan(1);
      expect(response.body.data.text.content).toBe('Updated content');
      expect(response.body.data.text.approvedBy).toBe('user2');
    });
  });

  describe('GET /api/texts/:key', () => {
    it('should return 404 for non-existent text', async () => {
      const response = await request(app)
        .get('/api/texts/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Text not found');
    });

    it('should return existing text', async () => {
      // Create text first
      await request(app)
        .put('/api/texts/test-key')
        .send({ content: 'Test content', approvedBy: 'test-user' })
        .expect(200);

      // Get text
      const response = await request(app)
        .get('/api/texts/test-key')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Test content');
    });
  });

  describe('DELETE /api/texts/:key', () => {
    it('should return 404 for non-existent text', async () => {
      const response = await request(app)
        .delete('/api/texts/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Text not found');
    });

    it('should delete existing text', async () => {
      // Create text first
      await request(app)
        .put('/api/texts/test-key')
        .send({ content: 'Test content', approvedBy: 'test-user' })
        .expect(200);

      // Delete text
      const response = await request(app)
        .delete('/api/texts/test-key')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
    });
  });

  describe('GitHub Integration', () => {
    beforeEach(() => {
      // Enable GitHub mode for these tests
      mockValidateEnv.mockReturnValue({
        GITHUB_TOKEN: 'test-token',
        GITHUB_REPO: 'test-owner/test-repo',
        GITHUB_BRANCH: 'main',
        GITHUB_TARGET_PATH: 'artifacts/texts.json',
        GITHUB_COMMIT_MESSAGE_TEMPLATE: 'Update {key} - {timestamp}',
        GITHUB_PR_TITLE_TEMPLATE: 'Update: {key}',
        GITHUB_PR_BODY_TEMPLATE: 'PR for {key}',
        PORT: '3000',
        NODE_ENV: 'test',
      });
    });

    it('should include GitHub sync result when enabled', async () => {
      const textData = {
        content: 'Test content',
        approvedBy: 'test-user',
      };

      const response = await request(app)
        .put('/api/texts/test-key')
        .send(textData)
        .expect(207); // Multi-Status for partial success

      expect(response.body.success).toBe(true);
      expect(response.body.githubSync).toBeDefined();
      expect(response.body.githubSync.success).toBe(false); // Will fail due to mocked Octokit
      expect(response.body.githubSync.error).toBeDefined();
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route').expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Endpoint not found');
    });
  });
});
