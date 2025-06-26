# Infinite Agentic Loop Command

Execute spec: {{spec_file}}
Output to: {{output_dir}}
Iterations: {{count}} (number or "infinite")

## Wave-based Execution Protocol

1. Launch 5 agents in parallel per wave
2. Wait for wave completion
3. Continue with next wave
4. Stop when {{count}} reached or context exhausted

## Each Agent Instructions

1. Read the spec file provided
2. You are agent iteration {{n}} of {{count}}
3. Create a UNIQUE variation different from all previous
4. Output complete implementation to {{output_dir}}/iteration-{{n}}/
5. Include a summary.md explaining your approach
6. Pass learnings forward for next iteration

## Context Management

- Monitor token usage
- If approaching limits, complete current wave and finalize
- Document stopping point for continuation

## Output Structure

```
{{output_dir}}/
├── iteration-1/
│   ├── [implementation files]
│   └── summary.md
├── iteration-2/
│   ├── [implementation files]
│   └── summary.md
└── overview.md (final summary of all iterations)
```