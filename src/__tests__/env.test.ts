import { validateEnv, isGitHubPRModeEnabled, envSchema } from '../config/env';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NODE_ENV; // Clear NODE_ENV to get default
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('envSchema', () => {
    it('should validate environment with all required fields', () => {
      process.env.GITHUB_TOKEN = 'test-token';
      process.env.GITHUB_REPO = 'owner/repo';
      process.env.PORT = '3000';
      process.env.NODE_ENV = 'production';

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.GITHUB_TOKEN).toBe('test-token');
        expect(result.data.GITHUB_REPO).toBe('owner/repo');
        expect(result.data.PORT).toBe('3000');
        expect(result.data.NODE_ENV).toBe('production');
      }
    });

    it('should use default values for optional fields', () => {
      process.env.GITHUB_TOKEN = 'test-token';
      process.env.GITHUB_REPO = 'owner/repo';

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.GITHUB_BRANCH).toBe('main');
        expect(result.data.GITHUB_TARGET_PATH).toBe('artifacts/texts.json');
        expect(result.data.PORT).toBe('3000');
        expect(result.data.NODE_ENV).toBe('development');
      }
    });

    it('should validate NODE_ENV enum', () => {
      process.env.NODE_ENV = 'invalid';

      const result = envSchema.safeParse(process.env);

      expect(result.success).toBe(false);
    });
  });

  describe('validateEnv', () => {
    it('should return validated environment', () => {
      process.env.GITHUB_TOKEN = 'test-token';
      process.env.GITHUB_REPO = 'owner/repo';

      const env = validateEnv();

      expect(env.GITHUB_TOKEN).toBe('test-token');
      expect(env.GITHUB_REPO).toBe('owner/repo');
      expect(env.GITHUB_BRANCH).toBe('main');
    });

    it('should throw error for invalid environment', () => {
      process.env.NODE_ENV = 'invalid';

      expect(() => validateEnv()).toThrow();
    });
  });

  describe('isGitHubPRModeEnabled', () => {
    it('should return true when GitHub credentials are provided', () => {
      const env = {
        GITHUB_TOKEN: 'test-token',
        GITHUB_REPO: 'owner/repo',
        GITHUB_BRANCH: 'main',
        GITHUB_TARGET_PATH: 'artifacts/texts.json',
        GITHUB_COMMIT_MESSAGE_TEMPLATE: 'Update {key}',
        GITHUB_PR_TITLE_TEMPLATE: 'PR: {key}',
        GITHUB_PR_BODY_TEMPLATE: 'Body for {key}',
        PORT: '3000',
        NODE_ENV: 'development' as const,
      };

      const result = isGitHubPRModeEnabled(env);

      expect(result).toBe(true);
    });

    it('should return false when GITHUB_TOKEN is missing', () => {
      const env = {
        GITHUB_TOKEN: undefined,
        GITHUB_REPO: 'owner/repo',
        GITHUB_BRANCH: 'main',
        GITHUB_TARGET_PATH: 'artifacts/texts.json',
        GITHUB_COMMIT_MESSAGE_TEMPLATE: 'Update {key}',
        GITHUB_PR_TITLE_TEMPLATE: 'PR: {key}',
        GITHUB_PR_BODY_TEMPLATE: 'Body for {key}',
        PORT: '3000',
        NODE_ENV: 'development' as const,
      };

      const result = isGitHubPRModeEnabled(env);

      expect(result).toBe(false);
    });

    it('should return false when GITHUB_REPO is missing', () => {
      const env = {
        GITHUB_TOKEN: 'test-token',
        GITHUB_REPO: undefined,
        GITHUB_BRANCH: 'main',
        GITHUB_TARGET_PATH: 'artifacts/texts.json',
        GITHUB_COMMIT_MESSAGE_TEMPLATE: 'Update {key}',
        GITHUB_PR_TITLE_TEMPLATE: 'PR: {key}',
        GITHUB_PR_BODY_TEMPLATE: 'Body for {key}',
        PORT: '3000',
        NODE_ENV: 'development' as const,
      };

      const result = isGitHubPRModeEnabled(env);

      expect(result).toBe(false);
    });

    it('should return false when both GitHub credentials are missing', () => {
      const env = {
        GITHUB_TOKEN: undefined,
        GITHUB_REPO: undefined,
        GITHUB_BRANCH: 'main',
        GITHUB_TARGET_PATH: 'artifacts/texts.json',
        GITHUB_COMMIT_MESSAGE_TEMPLATE: 'Update {key}',
        GITHUB_PR_TITLE_TEMPLATE: 'PR: {key}',
        GITHUB_PR_BODY_TEMPLATE: 'Body for {key}',
        PORT: '3000',
        NODE_ENV: 'development' as const,
      };

      const result = isGitHubPRModeEnabled(env);

      expect(result).toBe(false);
    });
  });
});
