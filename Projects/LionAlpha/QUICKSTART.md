# Quick Start Guide

Get up and running with Claude Code Heavy in under 2 minutes!

## 🚀 Installation (30 seconds)

```bash
# Clone the repository
git clone https://github.com/gtrusler/claude-code-heavy
cd claude-code-heavy

# Run setup
./setup.sh
```

**Note**: You'll need Claude Code installed (`npm install -g @anthropic-ai/claude-code`) and a Claude Pro or Teams subscription is strongly recommended for best performance.

## 🎯 Your First Research (Interactive Mode)

The easiest way to use Claude Code Heavy:

```bash
./ccheavy.sh
```

You'll see:
```
╔════════════════════════════════════════╗
║   Claude Code Heavy - Interactive Mode ║
╚════════════════════════════════════════╝

What would you like to research?
> How can cities reduce traffic congestion?

Output format? (markdown/text, or press Enter for markdown)
> [Enter]

Use --dangerously-skip-permissions flag?
Warning: This bypasses security checks. Only use if you trust the research.
Enable dangerous mode? (y/N)
> [Enter]

Ready to start research with:
  📝 Query: How can cities reduce traffic congestion?
  📄 Format: markdown
  ⚠️  Dangerous mode: false

Proceed? (Y/n)
> [Enter]
```

Then:
```
Setting Up Research Environment
Pre-creating 8 research workspaces...
✓ Created workspace for RA1
✓ Created workspace for RA2
...
✓ Created workspace for RA8
All workspaces ready! Claude will decide how many to use.

Would you like to launch Claude Code with the prompt? (Y/n)
> [Enter]

Launching Claude Code...
Claude will analyze your query and orchestrate the research!
```

## 📝 Command Line Mode

For automation or specific settings:

```bash
# Basic usage
./ccheavy.sh "What are the latest advances in quantum computing?"

# With text format output
./ccheavy.sh "Explain Docker containers" text

# YOLO mode
./ccheavy.sh "Analyze my private codebase" markdown --dangerous
```

## 🧠 What Claude Does

Once launched, Claude will:

1. **Analyze Your Query**: Understand scope and complexity
2. **Create Research Plan**: Decide how many assistants (2-8) and their questions
3. **Execute Research**: Run parallel searches and analysis
4. **Synthesize Results**: Combine all findings into comprehensive output

## 📊 Example Research Process

For "How can cities reduce traffic congestion?", Claude might:

1. **Decide on 4 assistants**:
   - RA1: Current solutions and technologies
   - RA2: Economic and policy approaches
   - RA3: Urban planning perspectives
   - RA4: Case studies and future trends

2. **Research in parallel** using web search

3. **Create outputs**:
   - `research-plan.md` - The strategy
   - `assistants/ra-1-findings.md` through `ra-4-findings.md`
   - `final-analysis.md` - Complete synthesis

## 📁 Understanding Your Output

After ~15-20 minutes, check your results:

```bash
# List all research outputs
ls -la outputs/

# View Claude's research plan
cat outputs/2025-07-18-reduce-traffic-congestion/research-plan.md

# View the final analysis
cat outputs/2025-07-18-reduce-traffic-congestion/final-analysis.md
```

## 💡 Pro Tips

1. **Let Claude decide**: It knows how many assistants to use
2. **Be specific**: "traffic congestion in large cities" > "traffic"
3. **Watch the magic**: Claude shows its thinking as it works
4. **Save good research**: Outputs are timestamped and organized

## 🔍 Monitoring Progress

While Claude Code runs, you'll see:
- The research plan being created
- Which assistant is currently researching
- What sources they're finding
- Progress through synthesis

## ❓ Common Questions

**Q: How many assistants will Claude use?**
A: Claude decides based on query complexity (usually 2-6).

**Q: Can I specify the number of assistants?**
A: No - this is Claude's decision based on optimal research strategy.

**Q: What if I want specific research angles?**
A: Make your query more specific to guide Claude's approach.

**Q: How long does research take?**
A: Typically 5-10 minutes, depending on complexity. Very complex queries might take up to 15-20 minutes.

## 🚨 Troubleshooting

### Claude Code doesn't open
Make sure Claude Code is installed: `npm install -g @anthropic-ai/claude-code`

### "Permission denied"
```bash
chmod +x ccheavy.sh setup.sh
```

### Git errors
Ensure you have git 2.7+ with worktree support:
```bash
git --version
```

## 🎉 Next Steps

1. Try different types of queries to see Claude adapt
2. Compare how Claude handles scientific vs business queries
3. Save interesting research plans for reference
4. Read the final analyses to see synthesis in action

Happy researching! 🔬
