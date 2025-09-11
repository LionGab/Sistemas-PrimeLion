#!/bin/bash
# ccheavy.sh - Claude Code Heavy Research System
# Parallel research orchestration using git worktrees

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
MAX_ASSISTANTS=8

# Helper function to generate folder-friendly names
generate_folder_name() {
    local query="$1"
    local max_length=60
    
    # Convert to lowercase and replace special chars with spaces
    local clean=$(echo "$query" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]/ /g')
    
    # Replace spaces with hyphens
    clean=$(echo "$clean" | sed 's/ /-/g' | sed 's/-\+/-/g' | sed 's/^-//;s/-$//')
    
    # Truncate if too long
    if [ ${#clean} -gt $max_length ]; then
        clean="${clean:0:$max_length}"
        # Remove trailing partial word
        clean=$(echo "$clean" | sed 's/-[^-]*$//')
    fi
    
    echo "$clean"
}

# Interactive mode function
interactive_mode() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════╗"
    echo "║   Claude Code Heavy - Interactive Mode ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Get research question
    echo -e "${GREEN}What would you like to research?${NC}"
    read -r -p "> " query
    
    # Get output format
    echo -e "\n${GREEN}Output format?${NC} (markdown/text, or press Enter for markdown)"
    read -r -p "> " format
    
    if [ -z "$format" ]; then
        format="markdown"
    fi
    
    # Ask about dangerous permissions
    echo -e "\n${YELLOW}Use --dangerously-skip-permissions flag?${NC}"
    echo -e "${RED}Warning: This bypasses security checks. Only use if you trust the research.${NC}"
    echo -e "Enable dangerous mode? (y/N)"
    read -r -p "> " dangerous_mode
    
    DANGEROUS_MODE="false"
    if [[ "$dangerous_mode" =~ ^[Yy]$ ]]; then
        DANGEROUS_MODE="true"
    fi
    
    # Confirm settings (default Y)
    echo -e "\n${BLUE}Ready to start research with:${NC}"
    echo -e "  📝 Query: $query"
    echo -e "  📄 Format: $format"
    echo -e "  ⚠️  Dangerous mode: $DANGEROUS_MODE"
    echo -e "\n${GREEN}Proceed? (Y/n)${NC}"
    read -r -p "> " confirm
    
    # Default to yes if empty or starts with y/Y
    if [[ -z "$confirm" || "$confirm" =~ ^[Yy] ]]; then
        # Continue
        :
    else
        echo -e "${YELLOW}Cancelled.${NC}"
        exit 0
    fi
    
    # Set globals for main execution
    QUERY="$query"
    OUTPUT_FORMAT="$format"
}

# Main script starts here
DANGEROUS_MODE="false"

if [ $# -eq 0 ]; then
    # No arguments - run interactive mode
    interactive_mode
else
    # Command line mode
    QUERY="$1"
    OUTPUT_FORMAT="${2:-markdown}"
    
    # Check for dangerous flag
    if [[ "${3:-}" == "--dangerous" ]]; then
        DANGEROUS_MODE="true"
    fi
fi

# Create output directory with descriptive name
FOLDER_NAME=$(generate_folder_name "$QUERY")
DATE=$(date +%Y-%m-%d)
OUTPUT_DIR="./outputs/${DATE}-${FOLDER_NAME}"
mkdir -p "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/assistants"

# Banner
echo -e "${CYAN}"
echo "╔════════════════════════════════════════╗"
echo "║   Claude Code Heavy Research System    ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${YELLOW}Query:${NC} $QUERY"
echo -e "${YELLOW}Output:${NC} $OUTPUT_DIR"
echo

# Pre-create all worktrees
echo -e "${BLUE}══ Setting Up Research Environment ══${NC}"
echo -e "${YELLOW}Pre-creating $MAX_ASSISTANTS research workspaces...${NC}"

for i in $(seq 1 "$MAX_ASSISTANTS"); do
    BRANCH="ra-$i-$(date +%s)"
    WORKTREE="worktrees/ra-$i"
    
    # Clean up if exists
    if git worktree list | grep -q "$WORKTREE"; then
        git worktree remove "$WORKTREE" --force 2>/dev/null || true
    fi
    
    # Create new worktree
    git worktree add -b "$BRANCH" "$WORKTREE" >/dev/null 2>&1
    echo -e "${GREEN}✓ Created workspace for RA$i${NC}"
done

echo -e "${CYAN}All workspaces ready! Claude will decide how many to use.${NC}"

# Create the orchestration prompt
if [ "$OUTPUT_FORMAT" = "markdown" ]; then
    PROMPT_FILE="$OUTPUT_DIR/orchestration-prompt.md"
    EXT="md"
    cat > "$PROMPT_FILE" << EOF
# Claude Code Heavy - Research Orchestration

You are orchestrating a comprehensive parallel research system. You have full control over the research process.

## Research Query
**$QUERY**

## Output Directory
All your outputs should be saved to: \`$OUTPUT_DIR\`

## Your Capabilities

1. **Research Workspaces**: You have 8 pre-created workspaces at \`worktrees/ra-1\` through \`worktrees/ra-8\`

2. **Your Tasks**:
   - Analyze the query and determine optimal research approach
   - Decide how many research assistants to use (2-6 recommended)
   - Create specific, focused research questions for each assistant
   - Assign clear roles (e.g., "Technology Expert", "Economic Analyst", etc.)
   - Coordinate the research in parallel

## Research Process

1. **Planning Phase**:
   - Analyze: "$QUERY"
   - Determine the number of assistants needed
   - Create research questions that cover all important angles
   - Save your plan to \`$OUTPUT_DIR/research-plan.md\`

2. **Research Phase**:
   - Visit each assistant's workspace: \`cd worktrees/ra-N\`
   - Have each assistant research their specific question
   - Use \`web_search\` and other tools extensively
   - **Execute searches in parallel** when possible
   - Save each assistant's findings to \`$OUTPUT_DIR/assistants/ra-N-findings.md\`

3. **Synthesis Phase**:
   - Review all findings
   - Create comprehensive analysis
   - Save to \`$OUTPUT_DIR/final-analysis.md\`

## Guidelines

- Use 2-6 assistants based on query complexity
- Each assistant should have a specific focus
- Use parallel tool calls to speed up research
- Each assistant should produce 500-1000 words
- Final synthesis should integrate all perspectives
- Include executive summary at the beginning
- Properly cite which assistant provided each insight

## Output Structure

1. \`research-plan.md\` - Your initial plan
2. \`assistants/ra-N-findings.md\` - Each assistant's research
3. \`final-analysis.md\` - Synthesized comprehensive analysis

Begin by analyzing the query and creating your research plan!
EOF
else
    # Text format
    PROMPT_FILE="$OUTPUT_DIR/orchestration-prompt.txt"
    EXT="txt"
    cat > "$PROMPT_FILE" << EOF
Claude Code Heavy - Research Orchestration

Research Query: $QUERY
Output Directory: $OUTPUT_DIR

You have 8 workspaces: worktrees/ra-1 through worktrees/ra-8

YOUR TASKS:
1. Analyze the query
2. Decide how many assistants (2-6 recommended)  
3. Create focused research questions
4. Assign roles to each assistant
5. Coordinate parallel research
6. Synthesize findings

PROCESS:
1. Save plan to: $OUTPUT_DIR/research-plan.md
2. Research using web_search (parallel when possible)
3. Save findings: $OUTPUT_DIR/assistants/ra-N-findings.md
4. Final synthesis: $OUTPUT_DIR/final-analysis.md

Begin by analyzing the query and creating your research plan!
EOF
fi

# Display completion and offer to launch (default Y)
echo
echo -e "${GREEN}✅ Setup complete!${NC}"
echo
echo -e "${BLUE}Would you like to launch Claude Code with the prompt? (Y/n)${NC}"
read -r -p "> " launch

# Default to yes if empty or starts with y/Y
if [[ -z "$launch" || "$launch" =~ ^[Yy] ]]; then
    echo -e "${YELLOW}Launching Claude Code...${NC}"
    echo -e "${GREEN}Claude will analyze your query and orchestrate the research!${NC}"
    
    # Build launch command
    LAUNCH_CMD="claude"
    if [ "$DANGEROUS_MODE" = "true" ]; then
        LAUNCH_CMD="$LAUNCH_CMD --dangerously-skip-permissions"
    fi
    LAUNCH_CMD="$LAUNCH_CMD --chat"
    
    # Launch Claude with the prompt pre-filled
    if command -v claude &> /dev/null; then
        $LAUNCH_CMD "$(cat "$PROMPT_FILE")" 2>/dev/null || \
        claude "$(cat "$PROMPT_FILE")" 2>/dev/null || \
        {
            echo -e "${YELLOW}Note: Could not auto-launch Claude Code. Please run manually:${NC}"
            if [ "$DANGEROUS_MODE" = "true" ]; then
                echo -e "${GREEN}claude --dangerously-skip-permissions${NC}"
            else
                echo -e "${GREEN}claude${NC}"
            fi
            echo -e "Then paste the prompt from: ${BLUE}$PROMPT_FILE${NC}"
        }
    else
        echo -e "${RED}Claude command not found. Please ensure Claude Code is installed.${NC}"
        echo -e "${YELLOW}Manual instructions:${NC}"
        echo -e "1. Open Claude Code"
        if [ "$DANGEROUS_MODE" = "true" ]; then
            echo -e "   with: claude --dangerously-skip-permissions"
        fi
        echo -e "2. Paste the prompt from: ${BLUE}$PROMPT_FILE${NC}"
    fi
else
    echo
    echo -e "${CYAN}══ Manual Launch Instructions ══${NC}"
    echo
    echo -e "${YELLOW}To start:${NC}"
    echo
    if [ "$DANGEROUS_MODE" = "true" ]; then
        echo "1. Run: ${GREEN}claude --dangerously-skip-permissions${NC}"
    else
        echo "1. Run: ${GREEN}claude${NC}"
    fi
    echo
    echo "2. Paste the orchestration prompt from:"
    echo "   ${BLUE}$PROMPT_FILE${NC}"
fi

echo
echo -e "${GREEN}Research will complete in ~15-20 minutes${NC}"
echo -e "${YELLOW}All outputs saved to: $OUTPUT_DIR/${NC}"
