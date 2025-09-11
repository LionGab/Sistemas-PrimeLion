# Comparison: make-it-heavy vs claude-code-heavy

## Architecture Comparison

### make-it-heavy (Python/OpenRouter)
```python
# Python-based orchestration
orchestrator = Orchestrator()
questions = generate_questions(query)
agents = [Agent() for _ in range(4)]
results = parallel_execute(agents, questions)
synthesis = synthesize(results)
```

### claude-code-heavy (Claude Code/Git)
```bash
# Shell-based orchestration  
claude -p "Generate questions" > questions.txt
for agent in 1..4; do
  claude --no-conversation-file -p "Research $question" &
done
claude -p "Synthesize findings" > final.md
```

## Feature Comparison

| Feature | make-it-heavy | claude-code-heavy |
|---------|---------------|-------------------|
| **Language** | Python | Bash + Claude Code |
| **API** | OpenRouter | Claude native |
| **Parallelism** | Python threads | Git worktrees + processes |
| **Token Limits** | Model dependent | 200k context |
| **Tool System** | Custom Python tools | Native + MCP tools |
| **Browser Access** | ❌ No | ✅ Puppeteer |
| **File System** | ✅ Via tools | ✅ Native |
| **Git Integration** | ❌ No | ✅ Full |
| **Cost** | Per API call | Claude subscription |
| **Setup Time** | ~5 minutes | ~30 seconds |

## Advantages of Each Approach

### make-it-heavy Advantages
- Works with any OpenRouter model
- Python ecosystem integration  
- Can run on servers without Claude
- Programmatic API for integration
- Custom tool creation is straightforward

### claude-code-heavy Advantages
- No API rate limits
- Massive context window (200k)
- Real browser for research
- Git tracking of all work
- Native file system access
- MCP tool ecosystem
- Can see/edit while running
- No token counting needed

## When to Use Each

### Use make-it-heavy when:
- You need to integrate with existing Python code
- You want to use specific models (GPT-4, Gemini, etc.)
- You're building a production API service
- You need programmatic control
- Running on servers/cloud

### Use claude-code-heavy when:
- You want maximum research depth
- You need real browser access
- You want to track/version the research
- You're doing exploratory analysis
- You have Claude Code available
- You want to see work in progress

## Code Translation Examples

### Question Generation

**make-it-heavy:**
```python
prompt = question_generation_prompt.format(
    query=query,
    num_agents=num_agents
)
response = llm.generate(prompt)
questions = parse_questions(response)
```

**claude-code-heavy:**
```bash
claude -p "Generate $AGENT_COUNT questions for: $QUERY
Format: QUESTION_N: [question]" > questions.txt

# Parse questions
grep "QUESTION_" questions.txt | cut -d: -f2-
```

### Parallel Execution

**make-it-heavy:**
```python
async def run_agents(questions):
    tasks = []
    for i, q in enumerate(questions):
        agent = Agent(f"Agent-{i+1}")
        tasks.append(agent.run(q))
    return await asyncio.gather(*tasks)
```

**claude-code-heavy:**
```bash
for i in $(seq 1 $AGENT_COUNT); do
    (cd worktrees/agent-$i && 
     claude -p "Research: ${QUESTIONS[$i]}" > findings.md) &
done
wait  # Wait for all agents
```

### Synthesis

**make-it-heavy:**
```python
synthesis_prompt = synthesis_template.format(
    responses=responses,
    num_responses=len(responses)
)
final_answer = llm.generate(synthesis_prompt)
```

**claude-code-heavy:**
```bash
claude -p "Synthesize findings from:
$(ls outputs/*/vp-*-findings.md)" > final-analysis.md
```

## Migration Guide

To convert a make-it-heavy workflow to claude-code-heavy:

1. **Replace Python orchestration with shell script**
2. **Use git worktrees instead of Python threads**
3. **Replace OpenRouter calls with `claude -p`**
4. **Tools become native operations or MCP tools**
5. **Use filesystem for communication between agents**

## Conclusion

Both approaches achieve the same goal - intelligent multi-agent research - but with different philosophies:

- **make-it-heavy**: Programmatic, API-driven, cloud-ready
- **claude-code-heavy**: Interactive, native, development-focused

Choose based on your use case and available tools.
