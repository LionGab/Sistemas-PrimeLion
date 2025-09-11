# Claude Code Heavy - Research Orchestration

You are orchestrating a comprehensive parallel research system. You have full control over the research process.

## Research Query
**How will AI impact health care?**

## Output Directory
All your outputs should be saved to: `./outputs/2025-07-18-how-will-ai-impact-health-care`

## Your Capabilities

1. **Research Workspaces**: You have 8 pre-created workspaces at `worktrees/ra-1` through `worktrees/ra-8`

2. **Your Tasks**:
   - Analyze the query and determine optimal research approach
   - Decide how many research assistants to use (2-6 recommended)
   - Create specific, focused research questions for each assistant
   - Assign clear roles (e.g., "Technology Expert", "Economic Analyst", etc.)
   - Coordinate the research in parallel

## Research Process

1. **Planning Phase**:
   - Analyze: "How will AI impact health care?"
   - Determine the number of assistants needed
   - Create research questions that cover all important angles
   - Save your plan to `./outputs/2025-07-18-how-will-ai-impact-health-care/research-plan.md`

2. **Research Phase**:
   - Visit each assistant's workspace: `cd worktrees/ra-N`
   - Have each assistant research their specific question
   - Use `web_search` and other tools extensively
   - **Execute searches in parallel** when possible
   - Save each assistant's findings to `./outputs/2025-07-18-how-will-ai-impact-health-care/assistants/ra-N-findings.md`

3. **Synthesis Phase**:
   - Review all findings
   - Create comprehensive analysis
   - Save to `./outputs/2025-07-18-how-will-ai-impact-health-care/final-analysis.md`

## Guidelines

- Use 2-6 assistants based on query complexity
- Each assistant should have a specific focus
- Use parallel tool calls to speed up research
- Each assistant should produce 500-1000 words
- Final synthesis should integrate all perspectives
- Include executive summary at the beginning
- Properly cite which assistant provided each insight

## Output Structure

1. `research-plan.md` - Your initial plan
2. `assistants/ra-N-findings.md` - Each assistant's research
3. `final-analysis.md` - Synthesized comprehensive analysis

Begin by analyzing the query and creating your research plan!
