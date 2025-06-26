# Multi-Agent Coordination Protocol

## Agent Orchestra Structure

### 🎼 The MealAppeal Symphony
```
├── Claude Code (CTO) - Main architecture & features
├── Agent 1 (Marketing) - Competitor research & strategy
├── Agent 2 (Product) - Feature planning & roadmaps
├── Agent 3 (Content) - Documentation & copy
└── Agent 4 (Analytics) - Metrics & user research
```

## Checkpoint-Based Development

### Checkpoint Structure
```markdown
## Checkpoint N: [Feature Name]
**Estimated Time:** 4-8 hours
**Dependencies:** Checkpoint M completed

### Tasks
- [ ] Core implementation
- [ ] Error handling
- [ ] Tests
- [ ] Documentation

### Success Criteria
- All tests pass
- No console errors
- Performance < 2s
- Accessible (WCAG 2.1)

### Review Gate
DO NOT proceed to next checkpoint until:
- All tasks complete
- Manual testing done
- Code reviewed
```

## Agent Handoff Protocol

### Information Flow
```
Marketing Agent → Product Agent
- User research findings
- Competitor analysis
- Market opportunities

Product Agent → Claude Code
- Feature specifications
- Priority rankings
- Technical requirements

Claude Code → Content Agent
- Completed features
- API documentation
- Usage examples

Content Agent → Marketing Agent
- Feature descriptions
- Launch materials
- User guides
```

## Parallel Execution Rules

### Wave Management
- Maximum 5 agents per wave
- 2-3 minute simple tasks
- 30+ minute complex tasks
- Monitor token usage
- Stop before context exhaustion

### Task Distribution
```yaml
Wave 1 (Morning):
  Claude Code: Core feature development
  Agent 1: Market research
  Agent 2: User interviews
  Agent 3: Documentation prep

Wave 2 (Afternoon):
  Claude Code: Testing & optimization
  Agent 1: Launch strategy
  Agent 2: Feature roadmap
  Agent 3: API documentation
```

## Communication Protocols

### Status Updates
Each agent maintains a status file:
```
/orchestration/agents/[agent-name]/status.md
- Current task
- Progress %
- Blockers
- Next steps
```

### Sync Points
- Checkpoint boundaries
- Every 4 hours
- Critical decisions
- Before major changes

## Conflict Resolution

### Priority Order
1. User safety & security
2. Core functionality
3. Performance
4. User experience
5. Nice-to-have features

### Decision Making
- Technical: Claude Code decides
- Product: Product Agent decides
- Marketing: Marketing Agent decides
- Conflicts: Escalate to user

## Quality Gates

### Before Integration
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Performance benchmarks met
- [ ] Security review complete
- [ ] Documentation updated

### Before Deployment
- [ ] All checkpoints complete
- [ ] Cross-agent review done
- [ ] User acceptance criteria met
- [ ] Launch materials ready

## Emergency Protocols

### When Things Break
1. STOP all agents
2. Assess damage
3. Revert if necessary
4. Identify root cause
5. Update coordination rules
6. Resume with fix

### Recovery Strategies
- Checkpoint rollback
- Git reset to last good state
- Individual agent restart
- Full orchestra reset

## Performance Metrics

Track for each checkpoint:
- Time to completion
- Bugs introduced
- Lines of code
- Test coverage
- Performance impact

## Weekly Retrospective

Every Friday:
1. Review checkpoint completions
2. Analyze agent effectiveness
3. Identify bottlenecks
4. Update coordination rules
5. Plan next week's orchestra