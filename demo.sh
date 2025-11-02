#!/bin/bash

# Demo script for GitHub PR Sync Service

echo "🚀 Starting GitHub PR Sync Service Demo"
echo "========================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your GitHub credentials if you want to enable GitHub sync."
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the service:"
echo "  npm run dev    # Development mode with hot reload"
echo "  npm start      # Production mode"
echo ""
echo "Once running, you can access:"
echo "  🌐 Admin UI:     http://localhost:3000/admin"
echo "  📊 Health Check: http://localhost:3000/health"
echo "  📚 API Docs:     See README.md for API documentation"
echo ""
echo "To enable GitHub PR sync:"
echo "  1. Edit .env file with your GitHub token and repo"
echo "  2. Restart the service"
echo "  3. Create/update texts through the admin UI"
echo "  4. Check GitHub for pull requests!"