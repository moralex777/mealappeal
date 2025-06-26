# Camera UI Variations Specification

Generate unique camera interface implementations for MealAppeal's food photography feature.

## Base Requirements (All Variations Must Include)
- Capture food photos
- Handle camera permissions
- Work offline with IndexedDB
- Mobile-first responsive design
- Accessibility compliant

## Variation Themes

### Iterations 1-5: Minimalist Approach
- Single button focus
- Clean, distraction-free UI
- Gesture-based controls
- Subtle animations

### Iterations 6-10: Guided Experience
- AI framing assistance
- Composition guidelines
- Lighting indicators
- Real-time tips

### Iterations 11-15: Professional Mode
- Manual controls (exposure, focus)
- Grid overlays
- Multiple capture modes
- RAW format support

### Iterations 16-20: Social-First
- Filters and effects
- Quick sharing options
- Story-style capture
- Collaborative features

### Iterations 21+: Innovative Explorations
- Voice-activated capture
- AR food placement
- Multi-angle capture
- Time-lapse meals

## Technical Implementation

Each variation must:
1. Use React 19 + TypeScript
2. Implement with Tailwind CSS v4
3. Follow glass morphism design
4. Include error boundaries
5. Support PWA installation

## Output Structure
```
/iteration-N/
├── components/
│   └── Camera.tsx
├── hooks/
│   └── useCamera.ts
├── styles/
│   └── camera.css
├── utils/
│   └── imageProcessing.ts
└── summary.md
```

## Variation Guidelines
- Each iteration builds on learnings from previous
- Document unique approach in summary.md
- Include performance metrics
- Note user experience innovations
- Suggest A/B test scenarios

## Evaluation Criteria
1. Code simplicity (lines of code)
2. Performance (time to capture)
3. User delight (unique features)
4. Accessibility score
5. Offline reliability