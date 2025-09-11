# Advanced Usage Guide

## 🧠 Understanding Claude's Orchestration

Claude Code Heavy is designed to give Claude full control over the research process. Here's what happens behind the scenes:

### 1. Query Analysis
Claude evaluates:
- Scope and complexity of the question
- Type of research needed (technical, historical, analytical, etc.)
- Optimal number of research assistants
- Best angles to approach the topic

### 2. Dynamic Planning
Claude creates a custom research plan including:
- Number of assistants (2-8)
- Specific research questions for each
- Assigned roles and perspectives
- Research methodology

### 3. Parallel Execution
Claude coordinates:
- Multiple web searches simultaneously
- Different research angles in parallel
- Efficient workspace switching
- Progress monitoring

## 🛠️ Command Line Options

### Basic Syntax
```bash
./ccheavy.sh "query" [format] [--dangerous]
```

### Examples
```bash
# Default markdown output
./ccheavy.sh "Analyze the impact of AI on education"

# Text format output
./ccheavy.sh "Compare React vs Vue frameworks" text

# YOLO mode
./ccheavy.sh "Analyze my project codebase" markdown --dangerous
```

## 🔒 Security Considerations

### Dangerous Mode
The `--dangerously-skip-permissions` flag:
- Allows Claude to access local files
- Enables system command execution
- Should only be used for trusted tasks
- Default is OFF for safety

### When to Use Dangerous Mode
- Analyzing local codebases
- Processing private documents
- System administration tasks
- Internal company research

### When NOT to Use
- General web research
- Public information gathering
- Untrusted queries
- Shared environments

## 📊 Output Analysis

### Research Plan (`research-plan.md`)
Claude's strategy document includes:
- Query interpretation
- Number of assistants and rationale
- Research questions for each assistant
- Expected outcomes

### Assistant Findings (`assistants/ra-N-findings.md`)
Each assistant produces:
- 500-1000 words of focused research
- Source citations
- Key insights for their angle
- Relevant data and examples

### Final Analysis (`final-analysis.md`)
The synthesis includes:
- Executive summary
- Integrated findings from all assistants
- Cross-referenced insights
- Conclusions and recommendations
- Source attributions

## 🎯 Optimizing Your Queries

### Be Specific
```bash
# Good
"Analyze the environmental impact of lithium mining for EV batteries"

# Better
"Compare environmental impacts of lithium mining in Chile vs Australia, focusing on water usage and ecosystem damage"
```

### Include Context
```bash
# Good
"Evaluate remote work policies"

# Better
"Evaluate remote work policies for tech startups with 50-200 employees in 2025"
```

### Specify Outcomes
```bash
# Good
"Research blockchain applications"

# Better
"Research blockchain applications in supply chain management with ROI analysis"
```

## 🔄 Workflow Integration

### Continuous Research
Create a research pipeline:
```bash
# Morning briefing
./ccheavy.sh "Latest developments in my industry"

# Competitive analysis
./ccheavy.sh "What are my competitors announcing this week"

# Trend analysis
./ccheavy.sh "Emerging trends in [your field]"
```

### Team Collaboration
Share research outputs:
```bash
# Research is saved with timestamps
ls outputs/

# Share specific analysis
cp outputs/2025-07-18-*/final-analysis.md ~/shared/research/
```

### Building Knowledge Base
```bash
# Create topic-based archives
mkdir -p ~/research/{market,technical,competitive}

# Organize by topic
cp outputs/*/final-analysis.md ~/research/market/
```

## 🚀 Performance Tips

### Query Optimization
1. **Front-load important terms**: Claude analyzes early words more heavily
2. **Use domain-specific language**: Helps Claude select appropriate sources
3. **Specify timeframes**: "last 6 months" vs "historical" changes approach

### System Optimization
1. **SSD recommended**: Faster git operations
2. **Good internet**: Parallel web searches need bandwidth
3. **Close unnecessary apps**: Claude Code uses significant resources

### Research Quality
1. **One topic at a time**: Better than combining multiple questions
2. **Iterate on findings**: Use outputs as input for deeper research
3. **Cross-reference**: Run similar queries for validation

## 🐛 Advanced Troubleshooting

### Worktree Issues
```bash
# Clean up all worktrees
git worktree prune
rm -rf worktrees/*

# Rebuild
./setup.sh
```

### Performance Issues
```bash
# Check git status
cd worktrees/ra-1
git status

# Clean up if needed
git clean -fd
```

### Recovery
```bash
# If research interrupted
# Outputs are continuously saved
# Check partial results in outputs/*/assistants/
```

## 🔬 Experimental Features

### Custom Prompts
Advanced users can modify the orchestration prompt:
1. Run the script normally
2. When prompt is created, edit before launching Claude
3. Add specific instructions or constraints

### Workspace Persistence
Worktrees remain after research:
- Inspect what each assistant researched
- See search history
- Understand Claude's process

### Chaining Research
Use outputs as inputs:
```bash
# Initial research
./ccheavy.sh "Overview of quantum computing"

# Deep dive based on findings
./ccheavy.sh "Detailed analysis of [specific finding from above]"
```

## 📈 Best Practices

1. **Start broad, then narrow**: General → Specific research chains
2. **Save exemplary outputs**: Build a library of good research
3. **Monitor patterns**: See how Claude approaches different topics
4. **Experiment freely**: Claude adapts to any research need

Remember: The power is in letting Claude orchestrate. Trust the AI to understand and adapt to your research needs!
