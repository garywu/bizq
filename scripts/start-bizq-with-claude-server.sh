#!/bin/bash

# BizQ with Claude Code SDK Startup Script
# This script starts BizQ with direct Claude Code SDK integration (no server needed)

echo "🚀 Starting BizQ with Claude Code SDK Integration"
echo "================================================"

# Function to check if a port is in use
check_port() {
    lsof -i:$1 > /dev/null 2>&1
    return $?
}

# Function to wait for service to be ready
wait_for_service() {
    echo "⏳ Waiting for $1 to be ready on port $2..."
    for i in {1..30}; do
        if check_port $2; then
            echo "✅ $1 is ready!"
            return 0
        fi
        sleep 1
    done
    echo "❌ $1 failed to start within 30 seconds"
    return 1
}

# Step 1: Check if Claude CLI is available
echo "🔍 Checking Claude CLI availability..."
if ! command -v claude &> /dev/null; then
    echo "❌ Claude CLI not found. Please install it first:"
    echo "   curl -fsSL https://claude.ai/install.sh | bash"
    exit 1
fi

echo "✅ Claude CLI found: $(claude --version)"

# Step 2: Check if Claude CLI is authenticated
echo "🔍 Checking Claude CLI authentication..."
if ! claude --version > /dev/null 2>&1; then
    echo "❌ Claude CLI not authenticated. Please run:"
    echo "   claude login"
    exit 1
fi

echo "✅ Claude CLI is authenticated"

# Step 3: Start BizQ (no server needed with Claude Code SDK)
echo "🔧 Starting BizQ with Claude Code SDK integration..."

# Navigate back to BizQ directory
cd "$(dirname "$0")"

# Check if BizQ port is available
if check_port 9321; then
    echo "⚠️  Port 9321 is already in use. BizQ may already be running."
    echo "📋 Visit: http://localhost:9321"
else
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing BizQ dependencies..."
        npm install
    fi
    
    # Start BizQ
    echo "🚀 Starting BizQ on port 9321..."
    npm run dev > bizq.log 2>&1 &
    BIZQ_PID=$!
    
    # Wait for BizQ to be ready
    if ! wait_for_service "BizQ" 9321; then
        echo "❌ Failed to start BizQ"
        echo "📋 Check logs: tail -f bizq.log"
        exit 1
    fi
    
    echo "✅ BizQ started (PID: $BIZQ_PID)"
fi

# Step 4: Test the integration
echo "🧪 Testing BizQ AI integration..."

# Test AI health endpoint
AI_HEALTH=$(curl -s http://localhost:9321/api/ai/health | grep -o '"success":true' || echo "")

if [ -n "$AI_HEALTH" ]; then
    echo "✅ BizQ AI integration is working!"
else
    echo "⚠️  BizQ AI integration may not be fully ready yet"
fi

# Step 5: Show status and instructions
echo ""
echo "🎉 Startup Complete!"
echo "==================="
echo ""
echo "📊 Services Status:"
echo "   • BizQ Web Interface: http://localhost:9321"
echo ""
echo "🔗 Integration Flow:"
echo "   BizQ → AI Manager → Claude Code SDK → Claude CLI"
echo ""
echo "🧪 Test Commands:"
echo "   • Test BizQ AI: curl http://localhost:9321/api/ai/health"
echo "   • Run integration test: npx tsx ai-manager.ts"
echo ""
echo "📋 Logs:"
echo "   • BizQ: tail -f bizq.log"
echo ""
echo "🛑 To stop services:"
echo "   • Kill BizQ: kill $BIZQ_PID"
echo "   • Or use: pkill -f tsx"
echo ""
echo "🌐 Open BizQ: http://localhost:9321"