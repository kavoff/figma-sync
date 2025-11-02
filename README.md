# Figma Plugin Content Management System

A comprehensive content management system for Figma plugins that leverages GitHub as the primary storage backend. This system provides workflows for designers, copywriters, and administrators to collaborate on content exports, reviews, and approvals.

## System Architecture

### Core Components

- **Figma Plugin**: Client-side plugin that enables designers to export content directly to GitHub repositories
- **API Backend**: Node.js/Express server handling authentication, rate limiting, and GitHub integration
- **Admin Dashboard**: Web interface for content review, approval workflows, and system management
- **GitHub Integration**: Seamless integration with GitHub repositories as the content storage layer

### Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Figma Plugin  │    │   API Backend   │    │   GitHub API    │
│                 │    │                 │    │                 │
│ • Export UI     │◄──►│ • Auth Service  │◄──►│ • Repo Storage  │
│ • Pull Content  │    │ • Rate Limiter  │    │ • Version Ctrl  │
│ • Duplicate     │    │ • Webhooks      │    │ • Commits       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Admin Dashboard │
                       │                 │
                       │ • Review UI     │
                       │ • Approval WF   │
                       │ • Status Mgmt   │
                       └─────────────────┘
```

### Rationale for GitHub-as-Storage

- **Version Control**: Native version history and branching capabilities
- **Collaboration**: Built-in collaboration features with pull requests and reviews
- **Reliability**: Enterprise-grade storage with 99.9% uptime SLA
- **Transparency**: All changes are visible through commit history
- **Integration**: Seamless integration with existing development workflows
- **Cost-Effective**: Leverages existing GitHub infrastructure without additional storage costs

## Workflows

### Designer Workflow (Figma Plugin)

1. **Export Content**
   - Select design elements in Figma
   - Configure export settings (format, metadata)
   - Plugin uploads content to GitHub repository
   - Content is marked as "Pending Review"

2. **Pull Content**
   - Fetch latest approved content from GitHub
   - Merge changes into current design
   - Resolve conflicts if any

3. **Duplicate Content**
   - Copy existing content to new locations
   - Maintain metadata and approval status
   - Bulk operations support

### Admin Review Workflow

1. **Content Review**
   - Access pending content via admin dashboard
   - Review exported content for quality and compliance
   - Add comments and annotations

2. **Approval Process**
   - Approve or reject content submissions
   - Request changes if needed
   - Update content status in GitHub

3. **Status Management**
   - Track content through lifecycle stages
   - Monitor approval metrics and turnaround times
   - Generate reports on team performance

### Pull Request Integration

- Content exports automatically create pull requests
- Admins review and merge through standard GitHub workflow
- Automated status updates based on PR state
- Integration with existing CI/CD pipelines

## Setup Guide

### Prerequisites

- Node.js 18+ 
- npm or yarn
- GitHub account with appropriate permissions
- Figma account (for plugin development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd figma-plugin-cms
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up GitHub integration**
   - Create GitHub Personal Access Token
   - Configure webhook endpoints
   - Set up repository permissions

### Environment Variables

Create a `.env` file with the following configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# GitHub Integration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_OWNER=your_github_org_or_username
GITHUB_REPO=your_content_repository

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
SESSION_SECRET=your_session_secret

# Database (if applicable)
DATABASE_URL=your_database_connection_string

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Figma Plugin
FIGMA_CLIENT_ID=your_figma_client_id
FIGMA_CLIENT_SECRET=your_figma_client_secret

# Vercel Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

### Running the Development Server

1. **Start the API server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Start the admin dashboard**
   ```bash
   npm run dashboard:dev
   # or
   yarn dashboard:dev
   ```

3. **Start the Figma plugin development**
   ```bash
   npm run plugin:dev
   # or
   yarn plugin:dev
   ```

### Building for Production

1. **Build the API backend**
   ```bash
   npm run build
   # or
   yarn build
   ```

2. **Build the admin dashboard**
   ```bash
   npm run dashboard:build
   # or
   yarn dashboard:build
   ```

3. **Build the Figma plugin**
   ```bash
   npm run plugin:build
   # or
   yarn plugin:build
   ```

### Testing

1. **Run unit tests**
   ```bash
   npm test
   # or
   yarn test
   ```

2. **Run integration tests**
   ```bash
   npm run test:integration
   # or
   yarn test:integration
   ```

3. **Run E2E tests**
   ```bash
   npm run test:e2e
   # or
   yarn test:e2e
   ```

4. **Run with coverage**
   ```bash
   npm run test:coverage
   # or
   yarn test:coverage
   ```

### Deployment to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Configure environment variables in Vercel**
   - Access Vercel dashboard
   - Navigate to project settings
   - Add all required environment variables

## API Reference

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "designer|admin|copywriter"
  },
  "expiresIn": "7d"
}
```

#### POST /api/auth/refresh
Refresh JWT token.

**Request:**
```json
{
  "token": "current_jwt_token"
}
```

**Response:**
```json
{
  "token": "new_jwt_token",
  "expiresIn": "7d"
}
```

### Content Management Endpoints

#### POST /api/content/export
Export content from Figma to GitHub.

**Request:**
```json
{
  "figmaData": {
    "nodes": [...],
    "metadata": {...}
  },
  "repository": "target-repo",
  "branch": "feature-branch"
}
```

**Response:**
```json
{
  "success": true,
  "pullRequest": {
    "url": "https://github.com/owner/repo/pull/123",
    "number": 123
  },
  "contentId": "content_123"
}
```

#### GET /api/content/:id
Retrieve content by ID.

**Response:**
```json
{
  "id": "content_123",
  "status": "pending|approved|rejected",
  "metadata": {...},
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

#### PUT /api/content/:id/approve
Approve content submission.

**Request:**
```json
{
  "comments": "Approved with minor suggestions"
}
```

**Response:**
```json
{
  "success": true,
  "status": "approved",
  "approvedAt": "2023-01-01T00:00:00Z",
  "approvedBy": "admin_user_id"
}
```

### GitHub Integration Endpoints

#### POST /api/github/webhook
Handle GitHub webhook events.

**Request Headers:**
```
X-Hub-Signature: sha1=...
X-GitHub-Event: pull_request
```

**Request Body:**
```json
{
  "action": "closed",
  "pull_request": {
    "number": 123,
    "state": "closed",
    "merged": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "processed": true
}
```

## Authentication Flow

### JWT + CSRF Protection

The system uses JSON Web Tokens (JWT) for authentication with CSRF protection:

1. **Login Process**
   - User submits credentials to `/api/auth/login`
   - Server validates credentials and generates JWT
   - Token is returned with CSRF token
   - Tokens are stored in HTTP-only cookies

2. **Request Authentication**
   - Client includes JWT in Authorization header
   - Server validates token signature and expiration
   - CSRF token is validated for state-changing requests
   - User context is extracted from token payload

3. **Token Refresh**
   - Automatic token refresh before expiration
   - Seamless user experience without re-login
   - Secure token rotation on each refresh

### Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Window**: 15 minutes (900,000ms)
- **Requests**: 100 requests per window per IP
- **Authentication**: Higher limits for authenticated users
- **Burst Handling**: Temporary burst capacity with gradual throttling

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Designer Guide

### Installing the Figma Plugin

1. **Download Plugin**
   - Obtain the latest plugin build from the releases page
   - Or build from source using the development setup

2. **Install in Figma**
   - Open Figma desktop app
   - Go to Plugins → Development → Import plugin from manifest
   - Select the plugin manifest file (`manifest.json`)

3. **Configure Plugin**
   - Enter your GitHub credentials
   - Configure default repository and branch settings
   - Set up export preferences

### Using the Plugin

#### Export Workflow

1. **Select Content**
   - Select design elements in your Figma file
   - Use selection tool to choose multiple elements
   - Right-click and choose "Export to CMS"

2. **Configure Export**
   - Choose export format (JSON, SVG, PNG, etc.)
   - Add metadata and tags
   - Select target repository and branch

3. **Review and Submit**
   - Preview exported content
   - Add comments for reviewers
   - Click "Export" to submit

#### Pull Workflow

1. **Fetch Updates**
   - Click "Pull from GitHub" in plugin menu
   - Select branch to pull from
   - Review incoming changes

2. **Merge Content**
   - Choose merge strategy (replace, merge, skip)
   - Resolve conflicts if any
   - Apply changes to current design

#### Duplicate Workflow

1. **Select Source Content**
   - Choose content to duplicate
   - Select multiple items for bulk operations

2. **Configure Duplication**
   - Set destination location
   - Choose duplication options (metadata, permissions)
   - Confirm and execute

### Troubleshooting

#### Common Issues

**Plugin not loading**
- Ensure Figma desktop app is updated
- Check plugin manifest syntax
- Verify plugin permissions

**Export failures**
- Check GitHub token permissions
- Verify repository access
- Review network connectivity

**Merge conflicts**
- Use conflict resolution interface
- Contact admin for assistance
- Consider creating new branch

#### Error Messages

- **"Invalid GitHub token"**: Re-authenticate with GitHub
- **"Repository not found"**: Check repository name and permissions
- **"Export size exceeded"**: Reduce content size or contact admin
- **"Rate limit exceeded"**: Wait and retry, or contact admin

## Admin Dashboard Guide

### Dashboard Overview

The admin dashboard provides comprehensive content management capabilities:

- **Content Review Queue**: Pending submissions awaiting review
- **Analytics Dashboard**: Usage metrics and performance indicators
- **User Management**: Role assignments and permissions
- **System Settings**: Configuration and integration settings

### Content Review Process

1. **Access Review Queue**
   - Navigate to "Content Review" section
   - Filter by status, user, or date range
   - Sort by priority or submission time

2. **Review Content**
   - Click on content item to open details
   - Review exported content and metadata
   - Compare with original design if needed

3. **Add Feedback**
   - Use comment system for feedback
   - Tag specific users for notifications
   - Set approval status and deadline

4. **Process Decision**
   - Approve content for production
   - Request changes with specific requirements
   - Reject with detailed reasoning

### Status Management

#### Content Statuses

- **Draft**: Initial content creation
- **Pending Review**: Submitted for admin review
- **In Review**: Currently being reviewed
- **Changes Requested**: Feedback provided, awaiting revisions
- **Approved**: Content approved for production
- **Rejected**: Content rejected, requires resubmission
- **Archived**: Historical content, no longer active

#### Status Workflows

```
Draft → Pending Review → In Review → Approved
                ↓           ↓
         Changes Requested ← Rejected
                ↓
            Pending Review
```

### GitHub Commit Visibility

All content changes are transparent through GitHub commits:

- **Automatic Commits**: Each export creates a commit with detailed metadata
- **Pull Requests**: Content submissions generate PRs for review
- **Commit Messages**: Standardized format with user attribution
- **Branch Strategy**: Feature branches for content updates
- **Merge History**: Complete audit trail of all changes

**Commit Format:**
```
feat: Add new hero section content

Designer: John Doe (john@example.com)
Content ID: content_123
Review Status: Pending Review
```

## Environment Configuration

### .env.example Template

```env
# =============================================================================
# Figma Plugin CMS Environment Configuration
# =============================================================================

# Server Configuration
PORT=3000
NODE_ENV=development
HOST=localhost

# GitHub Integration
GITHUB_TOKEN=ghp_your_github_personal_access_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GITHUB_OWNER=your_github_org_or_username
GITHUB_REPO=your_content_repository_name
GITHUB_BRANCH=main

# Authentication & Security
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
JWT_EXPIRES_IN=7d
SESSION_SECRET=your_session_secret_key_here
CSRF_SECRET=your_csrf_protection_secret

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# Figma API
FIGMA_CLIENT_ID=your_figma_client_id
FIGMA_CLIENT_SECRET=your_figma_client_secret
FIGMA_REDIRECT_URL=http://localhost:3000/auth/figma/callback

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Storage
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=json,svg,png,jpg,jpeg

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Monitoring & Analytics
SENTRY_DSN=your_sentry_dsn_here
ANALYTICS_ENABLED=true

# Vercel Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Feature Flags
ENABLE_BULK_OPERATIONS=true
ENABLE_WEBHOOKS=true
ENABLE_ANALYTICS=true
ENABLE_EMAIL_NOTIFICATIONS=false

# Development Overrides
DEV_GITHUB_TOKEN=dev_token_override
DEV_SKIP_AUTH=false
DEV_MOCK_GITHUB=false
```

### Environment Setup Steps

1. **Copy the template**
   ```bash
   cp .env.example .env
   ```

2. **Generate secure secrets**
   ```bash
   # Generate JWT secret
   openssl rand -base64 32
   
   # Generate CSRF secret
   openssl rand -hex 32
   ```

3. **Configure GitHub integration**
   - Create GitHub Personal Access Token with `repo` scope
   - Set up webhook endpoint in repository settings
   - Configure repository permissions

4. **Set up database** (if applicable)
   - Create PostgreSQL database
   - Run migration scripts
   - Test connection

5. **Verify configuration**
   ```bash
   npm run config:validate
   # or
   yarn config:validate
   ```

## Future Enhancements & Roadmap

### Short Term (Next 3 Months)

- **Enhanced Plugin Features**
  - Batch export capabilities
  - Advanced conflict resolution
  - Custom export templates

- **Dashboard Improvements**
  - Real-time collaboration features
  - Advanced filtering and search
  - Performance analytics

- **API Enhancements**
  - GraphQL support
  - WebSocket real-time updates
  - Advanced rate limiting

### Medium Term (3-6 Months)

- **Enterprise Features**
  - SSO integration (SAML, OAuth2)
  - Advanced role-based permissions
  - Audit logging and compliance

- **Performance Optimizations**
  - Caching layer implementation
  - Database query optimization
  - CDN integration for assets

- **Mobile Support**
  - Responsive admin dashboard
  - Mobile-optimized review workflow
  - Push notifications

### Long Term (6+ Months)

- **AI Integration**
  - Automated content validation
  - Smart conflict resolution
  - Content quality scoring

- **Advanced Analytics**
  - Usage pattern analysis
  - Performance metrics
  - Predictive insights

- **Platform Expansion**
  - Multi-tenant architecture
  - Plugin marketplace
  - Third-party integrations

### Technical Debt & Optimizations

- **Code Quality**
  - Increase test coverage to 90%+
  - Implement comprehensive E2E testing
  - Code quality gates in CI/CD

- **Security Enhancements**
  - Security audit and penetration testing
  - Enhanced input validation
  - Advanced threat detection

- **Scalability Improvements**
  - Horizontal scaling support
  - Load balancing configuration
  - Database sharding strategy

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the [FAQ](FAQ.md) for common questions

---

**Built with ❤️ for the Figma community**
