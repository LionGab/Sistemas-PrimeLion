#!/bin/bash
# setup.sh - Setup script for Claude Code Heavy

set -euo pipefail

echo "Setting up Claude Code Heavy..."

# Check prerequisites
echo "Checking prerequisites..."

# Check for Claude
if ! command -v claude &> /dev/null; then
    echo "❌ Claude Code not found. Please install:"
    echo "npm install -g @anthropic-ai/claude-code"
    exit 1
fi

# Check for git
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install git."
    exit 1
fi

# Create required directories
mkdir -p worktrees
mkdir -p outputs
mkdir -p templates
mkdir -p patterns

# Create default pattern
cat > patterns/default.yaml << 'EOF'
name: "Default Research Pattern"
agents: 4
questions:
  - "Factual research and direct information"
  - "Analysis and metrics"
  - "Alternative perspectives and criticisms"
  - "Verification and fact-checking"
EOF

# Create config
cat > config.sh << 'EOF'
# Claude Code Heavy Configuration

# Default number of agents
DEFAULT_AGENTS=4

# Output directory base
OUTPUT_BASE="./outputs"

# Synthesis style: comprehensive, concise, academic
SYNTHESIS_STYLE="comprehensive"

# Agent timeout (seconds)
AGENT_TIMEOUT=300

# Colors
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export MAGENTA='\033[0;35m'
export CYAN='\033[0;36m'
export NC='\033[0m'
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Outputs
outputs/
*.log

# Worktrees
worktrees/

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
*.swo

# Temporary
*.tmp
*.bak
EOF

# Make script executable
chmod +x ccheavy.sh
chmod +x setup.sh

echo "✅ Setup complete!"
echo
echo "Try it out:"
echo "./ccheavy.sh \"Who is Claude?\""
