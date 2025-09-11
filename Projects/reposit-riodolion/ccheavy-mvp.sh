#!/bin/bash
# ccheavy-mvp.sh - Claude Code Heavy Research System - MVP Version
# Parallel research orchestration using git worktrees - Limited to 2 assistants for MVP
# Optimized for AgroIA MVP testing with 10 farms

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# MVP Configuration - Limited assistants for focused research
MAX_ASSISTANTS=2  # Limited to 2 for MVP efficiency
MVP_MODE="true"

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

# Interactive mode function for MVP
interactive_mode() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════╗"
    echo "║   Claude Code Heavy - MVP Mode         ║"
    echo "║   AgroIA Research System (2 Agents)    ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${BLUE}MVP Mode: Research limited to 2 assistants for focused analysis${NC}"
    echo -e "${BLUE}Optimized for: 10-farm agricultural monitoring systems${NC}"
    echo
    
    # Get research question
    echo -e "${GREEN}What AgroIA research question would you like to investigate?${NC}"
    echo -e "${YELLOW}Examples:${NC}"
    echo "  - Como otimizar NDVI analysis para 10 fazendas?"
    echo "  - Melhores práticas WhatsApp alerts agricultura?"
    echo "  - Sentinel-2 processing para MVP escala?"
    echo
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
    echo -e "\n${BLUE}Ready to start MVP research with:${NC}"
    echo -e "  📝 Query: $query"
    echo -e "  📄 Format: $format"
    echo -e "  👥 Assistants: $MAX_ASSISTANTS (MVP limit)"
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
echo "║   AgroIA MVP Research System           ║"
echo "║   Claude Code Heavy - Limited Edition  ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${YELLOW}Query:${NC} $QUERY"
echo -e "${YELLOW}Output:${NC} $OUTPUT_DIR"
echo -e "${YELLOW}Assistants:${NC} $MAX_ASSISTANTS (MVP configuration)"
echo

# Pre-create only the needed worktrees (2 for MVP)
echo -e "${BLUE}══ Setting Up MVP Research Environment ══${NC}"
echo -e "${YELLOW}Pre-creating $MAX_ASSISTANTS research workspaces for MVP...${NC}"

for i in $(seq 1 "$MAX_ASSISTANTS"); do
    BRANCH="ra-$i-$(date +%s)"
    WORKTREE="worktrees/ra-$i"
    
    # Clean up if exists
    if git worktree list | grep -q "$WORKTREE"; then
        git worktree remove "$WORKTREE" --force 2>/dev/null || true
    fi
    
    # Create new worktree
    git worktree add -b "$BRANCH" "$WORKTREE" >/dev/null 2>&1
    echo -e "${GREEN}✓ Created MVP workspace for RA$i${NC}"
done

echo -e "${CYAN}MVP workspaces ready! Claude will use up to $MAX_ASSISTANTS assistants.${NC}"

# Create the orchestration prompt for MVP
if [ "$OUTPUT_FORMAT" = "markdown" ]; then
    PROMPT_FILE="$OUTPUT_DIR/orchestration-prompt.md"
    EXT="md"
    cat > "$PROMPT_FILE" << EOF
# AgroIA MVP Research System - Claude Code Heavy

You are orchestrating a **focused MVP research system** for agricultural monitoring. You have control over $MAX_ASSISTANTS research assistants maximum.

## Research Query
**$QUERY**

## MVP Context
- **Target**: 10 fazendas in Campo Verde, Mato Grosso, Brasil  
- **Scale**: Small-scale agricultural monitoring system
- **Focus**: Practical implementation and validation
- **Assistants**: Maximum $MAX_ASSISTANTS for focused, deep research

## Output Directory
All your outputs should be saved to: \`$OUTPUT_DIR\`

## Your Capabilities

1. **Research Workspaces**: You have $MAX_ASSISTANTS pre-created workspaces at \`worktrees/ra-1\` and \`worktrees/ra-2\`

2. **MVP Research Strategy**:
   - Use **exactly $MAX_ASSISTANTS assistants** for deeper, more focused analysis
   - Each assistant should cover a major aspect of the query
   - Emphasis on **practical implementation** for 10-farm system
   - Focus on **validation and testing** approaches

## Research Process

1. **Planning Phase**:
   - Analyze: "$QUERY"  
   - Divide into $MAX_ASSISTANTS major research areas
   - Create specific, actionable research questions for each assistant
   - Assign complementary roles (e.g., "Technical Implementation Expert" + "Validation & Testing Expert")
   - Save your plan to \`$OUTPUT_DIR/research-plan.md\`

2. **Research Phase**:
   - Visit each assistant's workspace: \`cd worktrees/ra-1\` and \`cd worktrees/ra-2\`
   - Have each assistant conduct **deep, thorough research** on their area
   - Use \`web_search\` and other tools extensively
   - **Execute searches in parallel** when possible  
   - Each assistant should produce 800-1200 words (longer since fewer assistants)
   - Save findings to \`$OUTPUT_DIR/assistants/ra-1-findings.md\` and \`$OUTPUT_DIR/assistants/ra-2-findings.md\`

3. **Synthesis Phase**:
   - Review both assistants' findings
   - Create comprehensive analysis focusing on **actionable implementation**
   - Include **specific next steps** for MVP validation
   - Save to \`$OUTPUT_DIR/final-analysis.md\`

## MVP Guidelines

- Use **exactly $MAX_ASSISTANTS assistants** - no more, no less
- Each assistant should have **distinct, complementary focus**  
- **Deeper research per assistant** (800-1200 words each)
- Focus on **practical implementation** for small-scale system
- Include **specific validation steps** for 10-farm MVP
- Consider **Brazilian agricultural context** (Campo Verde, MT)
- Emphasize **cost-effective solutions** appropriate for MVP scale
- Include **error handling and robustness** considerations

## Expected MVP Research Areas

Consider dividing research into areas like:
- **Technical Implementation & Architecture** 
- **Validation, Testing & Operations**
- **Cost Optimization & Scalability Planning**
- **Agricultural Domain Expertise & Best Practices**

Choose the $MAX_ASSISTANTS most critical areas for your specific query.

## Output Structure

1. \`research-plan.md\` - Your MVP research strategy
2. \`assistants/ra-1-findings.md\` - First assistant's deep research  
3. \`assistants/ra-2-findings.md\` - Second assistant's deep research
4. \`final-analysis.md\` - Integrated analysis with actionable MVP recommendations

Begin by analyzing the query and creating your focused $MAX_ASSISTANTS-assistant research plan!
EOF
else
    # Text format
    PROMPT_FILE="$OUTPUT_DIR/orchestration-prompt.txt"
    EXT="txt"
    cat > "$PROMPT_FILE" << EOF
AgroIA MVP Research System - Claude Code Heavy

Research Query: $QUERY
Output Directory: $OUTPUT_DIR
MVP Configuration: $MAX_ASSISTANTS assistants maximum

CONTEXT:
- Target: 10 farms in Campo Verde, MT, Brasil
- Scale: Small agricultural monitoring MVP
- Focus: Practical implementation and validation

YOUR TASKS:
1. Analyze the query 
2. Use exactly $MAX_ASSISTANTS assistants for focused research
3. Create deep, complementary research questions  
4. Assign clear roles to each assistant
5. Coordinate thorough parallel research
6. Synthesize into actionable MVP recommendations

PROCESS:
1. Save plan to: $OUTPUT_DIR/research-plan.md
2. Deep research using web_search (parallel when possible)
3. Save findings: $OUTPUT_DIR/assistants/ra-1-findings.md and $OUTPUT_DIR/assistants/ra-2-findings.md
4. Final synthesis: $OUTPUT_DIR/final-analysis.md

MVP FOCUS: 
- Practical implementation for 10 farms
- Validation and testing approaches  
- Brazilian agricultural context
- Cost-effective solutions
- Error handling and robustness

Begin by analyzing the query and creating your focused 2-assistant research plan!
EOF
fi

# Display completion and offer to launch (default Y)
echo
echo -e "${GREEN}✅ MVP Setup complete!${NC}"
echo -e "${BLUE}Research configuration: $MAX_ASSISTANTS assistants for focused analysis${NC}"
echo
echo -e "${BLUE}Would you like to launch Claude Code with the MVP prompt? (Y/n)${NC}"
read -r -p "> " launch

# Default to yes if empty or starts with y/Y
if [[ -z "$launch" || "$launch" =~ ^[Yy] ]]; then
    echo -e "${YELLOW}Launching Claude Code for MVP research...${NC}"
    echo -e "${GREEN}Claude will analyze your query and orchestrate focused $MAX_ASSISTANTS-assistant research!${NC}"
    
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
    echo -e "${YELLOW}To start MVP research:${NC}"
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
echo -e "${GREEN}MVP Research will complete in ~10-15 minutes${NC}"
echo -e "${GREEN}Focused analysis with $MAX_ASSISTANTS assistants for deeper insights${NC}"
echo -e "${YELLOW}All outputs saved to: $OUTPUT_DIR/${NC}"