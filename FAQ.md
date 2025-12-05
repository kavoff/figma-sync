# Frequently Asked Questions

## General Questions

### What is the Figma Plugin CMS?
The Figma Plugin CMS is a comprehensive content management system that allows designers to export content from Figma directly to GitHub repositories, with review and approval workflows for administrators and copywriters.

### Why use GitHub as storage?
GitHub provides enterprise-grade version control, collaboration features, reliability, and transparency while leveraging existing infrastructure without additional storage costs.

## Setup & Installation

### What are the system requirements?
- Node.js 18 or higher
- npm or yarn package manager
- GitHub account with appropriate permissions
- Figma account (for plugin development)

### How do I configure GitHub integration?
1. Create a GitHub Personal Access Token with `repo` scope
2. Configure webhook endpoints in your repository settings
3. Set up repository permissions for the application
4. Add the GitHub token to your environment variables

### What databases are supported?
The system supports PostgreSQL as the primary database, with Redis for caching and session management. Database configuration is done through the `DATABASE_URL` environment variable.

## Plugin Usage

### How do I install the Figma plugin?
1. Download the latest plugin build from the releases page
2. Open Figma desktop app
3. Go to Plugins → Development → Import plugin from manifest
4. Select the plugin manifest file (`manifest.json`)
5. Configure your GitHub credentials and preferences

### What file formats can I export?
The plugin supports multiple export formats including:
- JSON (for structured data)
- SVG (for vector graphics)
- PNG and JPG (for raster images)
- Custom formats can be configured through plugin settings

### How do I handle merge conflicts?
When pulling content from GitHub, the plugin provides a conflict resolution interface where you can:
- Choose to keep your local version
- Replace with the remote version
- Manually merge changes
- Contact an admin for assistance

## Admin Dashboard

### How do I access the admin dashboard?
The admin dashboard is accessible at `/dashboard` on your deployed instance. You'll need admin credentials to log in and access content management features.

### What are the different content statuses?
- **Draft**: Initial content creation
- **Pending Review**: Submitted for admin review
- **In Review**: Currently being reviewed
- **Changes Requested**: Feedback provided, awaiting revisions
- **Approved**: Content approved for production
- **Rejected**: Content rejected, requires resubmission
- **Archived**: Historical content, no longer active

### How can I track content changes?
All content changes are tracked through GitHub commits with standardized commit messages including:
- Designer information
- Content ID
- Review status
- Detailed change descriptions

## API & Integration

### How does authentication work?
The system uses JWT (JSON Web Tokens) for authentication with CSRF protection:
- Users authenticate via `/api/auth/login`
- Tokens are stored in HTTP-only cookies
- Automatic token refresh before expiration
- Secure token rotation on each refresh

### What are the rate limits?
The API implements rate limiting to ensure fair usage:
- 100 requests per 15-minute window per IP
- Higher limits for authenticated users
- Temporary burst capacity with gradual throttling
- Rate limit headers included in all responses

### How do webhooks work?
GitHub webhooks are used to notify the system of repository changes:
- Pull request events trigger status updates
- Merge events automatically update content status
- Webhook secrets ensure request authenticity
- Events are processed asynchronously

## Troubleshooting

### Plugin fails to load
- Ensure Figma desktop app is updated to latest version
- Check plugin manifest syntax (`manifest.json`)
- Verify plugin has necessary permissions
- Clear Figma plugin cache and restart

### Export failures
- Verify GitHub token has correct permissions
- Check repository access and visibility
- Review network connectivity
- Ensure export size doesn't exceed limits (10MB default)

### Authentication issues
- Verify JWT secret is properly configured
- Check token expiration settings
- Ensure CSRF protection is enabled
- Review user role assignments

### Rate limiting errors
- Wait for the rate limit window to reset
- Implement exponential backoff in client
- Consider authentication for higher limits
- Contact admin for limit adjustments

## Performance & Scaling

### How can I improve performance?
- Enable Redis caching for frequent requests
- Use CDN for static assets
- Implement database query optimization
- Consider horizontal scaling for high traffic

### What monitoring options are available?
- Built-in logging with Winston
- Optional Sentry integration for error tracking
- Analytics dashboard for usage metrics
- Custom monitoring via API endpoints

## Security

### How is data secured?
- JWT tokens with secure expiration
- CSRF protection for state-changing requests
- HTTPS enforcement in production
- Input validation and sanitization
- Secure header configuration with Helmet

### What security best practices are followed?
- Least privilege principle for GitHub tokens
- Environment variable configuration
- Regular security audits
- Dependency vulnerability scanning
- Secure cookie handling

## Deployment

### Can I deploy to Vercel?
Yes, the system is optimized for Vercel deployment:
- Automatic environment variable configuration
- Serverless function support
- Built-in CI/CD integration
- Edge optimization capabilities

### What other hosting options are available?
- AWS (Lambda, ECS, EC2)
- Google Cloud Platform
- Azure Functions
- DigitalOcean
- Self-hosted options with Docker

## Support

### How can I get help?
- Create an issue in the GitHub repository
- Check this FAQ for common solutions
- Review the documentation in README.md
- Contact the development team

### Where can I request features?
- Submit feature requests through GitHub issues
- Participate in community discussions
- Vote on existing feature requests
- Consider contributing to the project

## Development

### How can I contribute?
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request with detailed description
5. Follow the code of conduct

### What's the development workflow?
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write comprehensive tests
- Use semantic versioning for releases
- Maintain documentation updates

---

Still have questions? Feel free to open an issue or contact the development team!
