#!/bin/bash

echo "🚀 Testing Vikunja MCP Server Docker Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
print_status "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "Docker is running"

# Check if we're in the right directory
if [ ! -f "mcp-server/Dockerfile" ]; then
    print_error "Please run this script from the todo stack root directory"
    print_error "Expected structure: ./mcp-server/Dockerfile"
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f "mcp-server/.env" ]; then
    print_warning ".env file not found, creating from example..."
    cp mcp-server/.env.example mcp-server/.env
    print_warning "Please edit mcp-server/.env with your Vikunja credentials before continuing"
    print_warning "At minimum, set VIKUNJA_BASE_URL and either VIKUNJA_USERNAME/PASSWORD or VIKUNJA_API_TOKEN"
    echo
    echo "Press Enter to continue after editing .env, or Ctrl+C to cancel..."
    read
fi

# Load environment variables
if [ -f "mcp-server/.env" ]; then
    export $(grep -v '^#' mcp-server/.env | xargs)
fi

print_status "Building Docker image..."
cd mcp-server
docker build -t vikunja-mcp-server:test . 2>&1

if [ $? -ne 0 ]; then
    print_error "Failed to build Docker image"
    exit 1
fi
print_success "Docker image built successfully"

print_status "Starting MCP server container..."
docker-compose -f docker-compose.test.yml down 2>/dev/null
docker-compose -f docker-compose.test.yml up -d

if [ $? -ne 0 ]; then
    print_error "Failed to start container"
    exit 1
fi

print_status "Waiting for server to start..."
sleep 10

# Test health endpoint
print_status "Testing health endpoint..."
for i in {1..12}; do
    if curl -s http://localhost:8603/health > /dev/null; then
        print_success "Health endpoint is responding"
        break
    fi
    if [ $i -eq 12 ]; then
        print_error "Health endpoint not responding after 60 seconds"
        print_status "Checking container logs..."
        docker-compose -f docker-compose.test.yml logs mcp-server
        exit 1
    fi
    print_status "Waiting... (attempt $i/12)"
    sleep 5
done

# Test Vikunja connection
print_status "Testing Vikunja connection..."
health_response=$(curl -s http://localhost:8603/health)
echo "Health response: $health_response"

if echo "$health_response" | grep -q '"authenticated":true'; then
    print_success "Successfully authenticated with Vikunja"
elif echo "$health_response" | grep -q '"authenticated":false'; then
    print_warning "Server is running but not authenticated with Vikunja"
    print_warning "Check your credentials in .env file"
else
    print_error "Could not determine authentication status"
fi

echo
echo "======================================"
print_success "MCP Server Test Summary"
echo "======================================"
echo "🌐 Server URL: http://localhost:8603"
echo "🏥 Health Check: http://localhost:8603/health"
echo "🔌 MCP Endpoint: http://localhost:8603/message"
echo

print_status "Container Status:"
docker-compose -f docker-compose.test.yml ps

echo
print_status "To view logs in real-time:"
echo "  docker-compose -f docker-compose.test.yml logs -f"

print_status "To stop the test server:"
echo "  docker-compose -f docker-compose.test.yml down"

print_status "To test MCP tools, you can use curl:"
echo '  curl -X POST http://localhost:8603/message \'
echo '    -H "Content-Type: application/json" \'
echo '    -d '\''{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'\'''

cd ..
print_success "Docker test setup complete! 🎉"