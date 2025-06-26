# End Session Command

Generate comprehensive session summary including:

## Session Metrics
- **End Time:** {{timestamp}}
- **Duration:** {{duration}}
- **Files Changed:** {{count}}
- **Lines Added:** {{added}}
- **Lines Removed:** {{removed}}
- **Commits Made:** {{commits}}

## Goals Achievement
Review initial goals and mark completion:
- [x] Completed goals
- [ ] Incomplete goals
- [~] Partially completed

## Files Modified
### Modified Files
```
{{file_path}} (+{{added}} -{{removed}})
  - {{change_description}}
```

### New Files Created
```
{{new_file_path}}
  - {{purpose}}
```

### Files Deleted
```
{{deleted_file}}
  - {{reason}}
```

## Problems Encountered & Solutions
{{foreach problem}}
### Problem {{n}}: {{title}}
**Issue:** {{description}}
**Root Cause:** {{cause}}
**Solution:** {{solution}}
**Files:** {{affected_files}}
**Prevented Future Occurrence:** {{prevention}}
{{/foreach}}

## Key Learnings
{{foreach learning}}
- **{{category}}**: {{insight}}
  - Impact: {{impact}}
  - Applied to: {{where_applied}}
{{/foreach}}

## Code Quality Improvements
- Performance optimizations
- Security enhancements
- Refactoring completed
- Technical debt addressed

## Testing
### Tests Written
- {{test_file}}: {{coverage}}

### Manual Testing Checklist
- [ ] {{test_scenario_1}}
- [ ] {{test_scenario_2}}
- [ ] Edge cases verified

## Git Activity
### Commits
{{foreach commit}}
- `{{hash}}` {{type}}: {{message}}
  Files: {{files}}
{{/foreach}}

## Next Session Notes
### Continue With
- {{task_1}}
- {{task_2}}

### Unresolved Issues
- {{issue_1}}
- {{issue_2}}

### Technical Debt
- {{debt_1}}
- {{debt_2}}

## Recommendations
- {{recommendation_1}}
- {{recommendation_2}}

---
**Session Productivity Score:** {{score}}/10
**Key Achievement:** {{main_achievement}}