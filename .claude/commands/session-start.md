# Start New Session

Create session file: /sessions/{{date}}-{{time}}-{{slug}}.md

## Initialize Session with:

```markdown
# Session: {{description}}
**Start Time:** {{timestamp}}
**Type:** {{type}} (feature|bugfix|optimization|exploration)

## Goals
- [ ] {{goal1}}
- [ ] {{goal2}}
- [ ] {{goal3}}

## Technical Constraints
- {{constraint1}}
- {{constraint2}}

## Files to Modify
- {{file1}}
- {{file2}}

## Success Criteria
- {{criterion1}}
- {{criterion2}}

---

## Session Log
{{timestamp}}: Session started
```

## Usage
/session-start "Implement camera module with offline support"