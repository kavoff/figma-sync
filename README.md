# GitHub PR Sync Service

A Node.js/TypeScript service for managing text approvals and optionally syncing them to GitHub pull requests.

## Features

- **Text Management**: Create, update, retrieve, and delete text items with approval tracking
- **JSON Artifact Generation**: Automatically generates JSON artifacts from approved texts
- **GitHub PR Sync**: Optional Direct PR Mode that creates GitHub pull requests when texts are approved
- **Race Condition Handling**: Robust handling of concurrent changes with automatic retries
- **RESTful API**: Clean REST API for text management
- **Type Safety**: Full TypeScript implementation with Zod validation
- **Comprehensive Testing**: Unit tests for all services and API endpoints

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd github-pr-sync-service

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Basic Usage (Without GitHub Sync)

```bash
# Start the development server
npm run dev

# Or build and run in production
npm run build
npm start
```

The service will be available at `http://localhost:3000`.

### GitHub PR Mode Setup

To enable GitHub PR sync, configure the following environment variables in your `.env` file:

```bash
# Required for GitHub PR Mode
GITHUB_TOKEN=ghp_your_personal_access_token_here
GITHUB_REPO=your-username/your-repo

# Optional GitHub Configuration
GITHUB_BRANCH=main
GITHUB_TARGET_PATH=artifacts/texts.json
GITHUB_COMMIT_MESSAGE_TEMPLATE="Update text artifact for {key} - {timestamp}"
GITHUB_PR_TITLE_TEMPLATE="Text Update: {key}"
GITHUB_PR_BODY_TEMPLATE="Automated text update for {key} at {timestamp}"
```

#### GitHub Token Requirements

The GitHub token needs the following permissions:
- `repo` - Full control of private repositories
- `pull requests` - Create and manage pull requests

#### Repository Setup

1. Ensure the target repository exists and you have write access
2. The service will automatically create the target file and directory structure if they don't exist
3. Pull requests will be created from feature branches to the configured base branch

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Health Check
```
GET /health
```

Returns the service health status and GitHub PR mode status.

#### Get All Texts
```
GET /api/texts
```

Returns all text items and artifact metadata.

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "lastUpdated": "2023-11-02T10:30:00.000Z",
    "count": 2,
    "texts": {
      "welcome-message": {
        "key": "welcome-message",
        "content": "Welcome to our application!",
        "approvedAt": "2023-11-02T10:30:00.000Z",
        "approvedBy": "admin",
        "version": 1
      }
    }
  }
}
```

#### Get Specific Text
```
GET /api/texts/:key
```

Retrieves a specific text item by its key.

#### Create/Update Text
```
PUT /api/texts/:key
```

Creates or updates a text item with approval.

**Request Body:**
```json
{
  "content": "The text content",
  "approvedBy": "username"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": {
      "key": "example-key",
      "content": "The text content",
      "approvedAt": "2023-11-02T10:30:00.000Z",
      "approvedBy": "username",
      "version": 1
    },
    "artifact": {
      "version": "1.0.0",
      "lastUpdated": "2023-11-02T10:30:00.000Z",
      "count": 1
    }
  },
  "githubSync": {
    "success": true,
    "prUrl": "https://github.com/owner/repo/pull/123"
  }
}
```

#### Delete Text
```
DELETE /api/texts/:key
```

Deletes a text item by its key.

### Response Codes

- `200` - Success
- `207` - Multi-Status (text updated but GitHub sync failed)
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## GitHub PR Sync Flow

When GitHub PR mode is enabled, the service follows this workflow on text approval:

1. **Content Comparison**: Compares the new JSON artifact with the existing file in GitHub
2. **No-Op if Unchanged**: If content is identical, no PR is created
3. **Branch Creation**: Creates a feature branch from the configured base branch
4. **Content Commit**: Commits the updated JSON artifact to the feature branch
5. **PR Creation**: Creates a pull request with configurable title and body
6. **Error Handling**: 
   - Race conditions trigger an automatic retry
   - GitHub errors are logged but don't fail the text update
   - Failed sync attempts return `207 Multi-Status`

### Template Variables

The GitHub configuration templates support these variables:
- `{key}` - The text item key
- `{timestamp}` - ISO timestamp of the update

## Development

### Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Testing
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode

# Code Quality
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
```

### Project Structure

```
src/
├── config/
│   └── env.ts              # Environment configuration
├── controllers/
│   └── text.controller.ts   # API request handlers
├── routes/
│   └── api.routes.ts        # API route definitions
├── services/
│   ├── github.service.ts    # GitHub integration service
│   └── text.service.ts      # Text management service
├── __tests__/
│   ├── api.test.ts          # API endpoint tests
│   ├── github.service.test.ts # GitHub service tests
│   └── text.service.test.ts   # Text service tests
└── index.ts                 # Application entry point
```

### Running Tests

```bash
# Run all tests with coverage
npm test

# Run specific test file
npm test -- github.service.test.ts

# Run tests in watch mode for development
npm run test:watch
```

## Environment Variables

### Required for Basic Operation
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production/test)

### Required for GitHub PR Mode
- `GITHUB_TOKEN` - GitHub personal access token
- `GITHUB_REPO` - Target repository (owner/repo format)

### Optional GitHub Configuration
- `GITHUB_BRANCH` - Base branch for PRs (default: main)
- `GITHUB_TARGET_PATH` - Target file path (default: artifacts/texts.json)
- `GITHUB_COMMIT_MESSAGE_TEMPLATE` - Commit message template
- `GITHUB_PR_TITLE_TEMPLATE` - Pull request title template
- `GITHUB_PR_BODY_TEMPLATE` - Pull request body template

## Error Handling

### API Errors
All API responses follow a consistent format:
```json
{
  "success": false,
  "error": "Error description",
  "details": [] // Validation errors (if applicable)
}
```

### GitHub Sync Errors
GitHub sync errors are included in the response but don't fail the text update:
```json
{
  "success": true,
  "data": { /* text data */ },
  "githubSync": {
    "success": false,
    "error": "GitHub API error message"
  }
}
```

### Race Conditions
The service handles concurrent GitHub updates by:
1. Detecting SHA mismatches during file commits
2. Automatically retrying once with the latest file content
3. Gracefully failing after the retry limit

## Security Considerations

- Store GitHub tokens securely using environment variables
- Use GitHub Apps or fine-grained personal access tokens with minimal required permissions
- The service exposes no authentication - consider adding API authentication for production use
- Input validation is performed using Zod schemas

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

[Add your license here]