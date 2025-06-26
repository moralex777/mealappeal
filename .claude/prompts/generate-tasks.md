# Task Generation Template

Break down PRD into atomic, executable tasks.

## Task Structure Rules

### Format Requirements
```markdown
## Relevant Files
- src/path/to/file1.ts
- src/path/to/file2.tsx
- api/endpoints/relevant.ts

## Dependencies
- [ ] Prerequisite task 1
- [ ] Prerequisite task 2

## Tasks
1. [ ] Parent Task Category
   1.1 [ ] Specific subtask
       1.1.1 [ ] Atomic action
       1.1.2 [ ] Atomic action
   1.2 [ ] Another subtask
2. [ ] Next Parent Category
   2.1 [ ] Subtask
```

### Task Writing Guidelines
- One atomic action per task
- Include file paths in task description
- Maximum 3 levels of nesting
- 5-10 subtasks per parent
- Clear completion criteria
- No compound actions (avoid "and")

### Task Categories
- **Setup**: Environment, dependencies, configuration
- **Core Implementation**: Main functionality
- **Integration**: Connecting components
- **Testing**: Unit, integration, E2E
- **Documentation**: Code comments, README updates
- **Polish**: UI refinements, performance

### Estimation Guidelines
- Atomic task: 5-30 minutes
- Subtask group: 30-120 minutes
- Parent task: 2-8 hours

### Example Task Breakdown
```markdown
1. [ ] Camera Module Implementation
   1.1 [ ] Set up PWA manifest for camera
       1.1.1 [ ] Add camera permission to manifest.json
       1.1.2 [ ] Configure HTTPS requirement
   1.2 [ ] Implement camera access
       1.2.1 [ ] Create useCameraAccess hook
       1.2.2 [ ] Handle permission request
       1.2.3 [ ] Implement permission denied UI
```

## Stop Points
Mark natural stopping points with:
```
--- STOP AND REVIEW ---
```

## Usage
```
@generate-tasks.md Break down @prds/camera-module-prd.md into executable tasks
```