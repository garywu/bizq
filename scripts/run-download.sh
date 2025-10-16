#!/bin/bash
# 10Web Industry Explorer Download Script Runner

echo "🚀 Starting 10Web Industry Explorer Download"
echo "📦 Using uv for dependency management"
echo ""

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ uv is not installed. Please install uv first:"
    echo "   curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Navigate to BizQ directory
cd "$(dirname "$0")/.."

# Sync dependencies from pyproject.toml
echo "📦 Syncing dependencies from pyproject.toml..."
uv sync

# Run the download script
echo "🏃 Running download script..."
uv run python scripts/download-10web-industries.py

echo ""
echo "✅ Download process completed!"
