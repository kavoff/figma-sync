import { z } from 'zod';

export const envSchema = z.object({
  // GitHub PR Sync - Optional
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_REPO: z.string().optional(),
  GITHUB_BRANCH: z.string().default('main'),
  GITHUB_TARGET_PATH: z.string().default('artifacts/texts.json'),
  GITHUB_COMMIT_MESSAGE_TEMPLATE: z
    .string()
    .default('Update text artifact for {key} - {timestamp}'),
  GITHUB_PR_TITLE_TEMPLATE: z.string().default('Text Update: {key}'),
  GITHUB_PR_BODY_TEMPLATE: z
    .string()
    .default('Automated text update for {key} at {timestamp}'),

  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const env = envSchema.parse(process.env);
  return env;
}

export function isGitHubPRModeEnabled(env: Env): boolean {
  return !!(env.GITHUB_TOKEN && env.GITHUB_REPO);
}
