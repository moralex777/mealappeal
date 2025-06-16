# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎉 DEPLOYMENT CELEBRATION - June 15, 2025 🎉

**MealAppeal is LIVE in production!** 🚀

- **Production URL**: https://www.mealappeal.app
- **Deployment Date**: June 15, 2025, 9:30 PM
- **Deployed By**: Alexander Morari with Claude Code assistance
- **Platform**: Vercel (with custom domain)
- **Status**: ✅ Fully operational with all core features working

### Critical Production Learnings:
- Vercel serverless can't write log files - use console logging only
- Database triggers must match exact column names in profiles table
- Camera permissions require explicit domain allowlist in headers
- API parameter validation must match between frontend and backend
- Mobile browsers require longer delays for auth state propagation
- Clear browser cache after deployment for mobile users to get updates
- Users with existing accounts must use LOGIN not SIGNUP (common confusion)
- Database triggers may fail silently - always verify profile creation
- **CRITICAL**: image_url column must be TEXT not VARCHAR(50000) - truncation causes grey placeholders

### Navigation System Success (June 16, 2025) ✅
- **Golden Standard Navigation**: Unified glass morphism design across entire app
- **Removed Duplicate Headers**: Fixed account, billing, and privacy pages
- **Mobile-First Bottom Nav**: Snap (primary), Feed, Streaks, Profile with engagement features
- **Clean Architecture**: AppLayout provides navigation - pages no longer need custom headers
- **Performance**: All CSS animations at 60fps, no JavaScript required
- **Engagement Metrics**: Camera-first navigation hypothesis implemented

---

## MealAppeal Overview

MealAppeal is a smart nutrition analysis SaaS application built with Next.js and Supabase. Users photograph meals to receive instant nutrition insights through OpenAI Vision API integration, with a freemium subscription model targeting health-conscious consumers.

## Common Development Commands

```bash
# Essential Development Workflow
npm run setup           # One-command environment setup and validation (RUN THIS FIRST!)
npm run dev             # Start Next.js development server (http://localhost:3000)
                       # IMPORTANT: Always run in separate terminal for testing!
npm run security:scan   # Scan for hardcoded credentials (RUN BEFORE COMMITS!)

# Testing & Validation
npm run test:all        # Run comprehensive test suite (runs all scripts in scripts/test/)
npm run db:validate     # Validate database schema against expected structure
npm run debug:login     # Test user authentication flow
npm run debug:signup    # Create test users with premium accounts
npm run health:check    # Quick API health check

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues automatically
npm run format          # Format code with Prettier
npm run typecheck       # Run TypeScript type checking
npm run validate        # Run all checks (lint, format, typecheck)

# Environment Management
npm run dev:reset       # Nuclear reset - clean + setup (USE WHEN STUCK!)
npm run clean           # Clean old reports and temporary files
npm run clean:preview   # Preview what would be cleaned

# Deployment
vercel --prod          # Deploy to production (immediate)
npm run build          # Build for production locally
npm run start          # Start production server locally
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.3.2 (App Router), React 19, TypeScript (strict mode), Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage), Edge Functions
- **Analysis**: OpenAI Vision API (gpt-4o-mini-2024-07-18) with USDA nutrition enhancement
- **Payments**: Stripe subscriptions (Premium Monthly $19.99, Premium Yearly $199)
- **UI**: Radix UI components with MealAppeal glass morphism design system
- **PWA**: Service workers, offline functionality, mobile-first responsive design
- **Infrastructure**: Redis (Upstash), Sentry monitoring, Winston logging
- **Security**: Zod validation, CORS hardening, rate limiting, input sanitization

### Key Architectural Patterns

**1. API Route Pattern (Consistent Across All Routes)**
```typescript
// Standard pattern for all API routes:
// 1. Security headers and CORS
// 2. Input validation with Zod schemas
// 3. Rate limiting check
// 4. Correlation ID for request tracking
// 5. Try-catch with structured error logging
// 6. Graceful degradation with fallbacks
```

**2. Authentication & Profile Management**
- **Multi-Layer Profile Fallback System** in `AuthContext`:
  1. Try full profile query with all columns
  2. Fall back to basic query if columns missing
  3. Create in-memory profile if database fails
  4. Attempt async database profile creation
- Critical for preventing registration failures due to schema mismatches
- Handles missing `billing_cycle` and `subscription_expires_at` columns gracefully

**3. Database Operations Pattern**
- **Retry Logic**: 3 attempts with exponential backoff and jitter
- **Connection Pooling**: Optimized for serverless environments
- **Timeout Protection**: AbortSignal timeouts (2-10 seconds)
- **Graceful Fallbacks**: Never block user actions on DB failures

**4. Food Analysis Pipeline**
```
Image → Validation → Rate Limit → OpenAI Vision → USDA Enhancement → Cache → Database
```
- **Tier-Based Rate Limiting**: Free (10/hr), Premium Monthly (100/hr), Premium Yearly (200/hr)
- **Progressive Enhancement**: Premium gets higher token limits and image detail
- **Mock Data Fallback**: Development mode includes realistic responses
- **Response Caching**: 5-minute TTL to reduce API costs

**5. Security Implementation**
- **Input Sanitization**: Custom `sanitizeHtml` function for all text inputs
- **Path Traversal Protection**: File name sanitization
- **Structured Validation**: Zod schemas with XSS protection
- **CORS Configuration**: Production domain only
- **CSP Headers**: Allow `data:` URLs for image processing

### Directory Structure & Organization

```
/
├── scripts/                # ALL test and utility scripts go here!
│   ├── dev/               # Development helpers
│   ├── test/              # Test scripts (run via npm run test:all)
│   ├── db/                # Database utilities
│   └── maintenance/       # Cleanup scripts
├── reports/               # Test output (auto-cleaned after 7 days)
├── temp/                  # Temporary files (auto-cleaned after 1 day)
├── src/lib/              # Core infrastructure
│   ├── database.ts       # DB operations with retry logic
│   ├── rate-limit.ts     # Redis-based distributed rate limiting
│   ├── validation.ts     # Security schemas and sanitization
│   └── logger.ts         # Structured logging (console-only for Vercel)
└── src/app/api/          # API routes with consistent patterns
```

**IMPORTANT**: Never create test files in the project root! Use `scripts/test/`

### Critical Implementation Details

**1. Environment Variables**
- Run `npm run setup` to validate all required variables
- Logger automatically switches to console-only in production (Vercel limitation)
- Missing optional services (Redis, USDA) handled gracefully

**2. OpenAI Integration**
- **Current**: All tiers use `gpt-4o-mini-2024-07-18`
- **TODO**: Implement tier-based models (gpt-4o for Monthly, gpt-4.1 for Yearly)
- **Token Limits**: Premium 2000 vs Free 500
- **Image Detail**: Premium "high" vs Free "low"
- **Response Format**: Structured JSON with `response_format: { type: "json_object" }`

**3. Database Schema Gotchas**
- Profile lookups use `user_id` NOT `id`
- Profiles table has automatic meal count update triggers
- Free tier meal limit (3/day) enforced by database function
- Some columns may be missing - always use fallback queries

**4. Production Fixes Applied**
- CSP headers allow `data:` URLs in connect-src
- Camera permissions explicitly allow www.mealappeal.app
- Mobile auth requires longer propagation delays
- Email storage trigger checks multiple metadata sources

### UI/UX Design System

**Glass Morphism Pattern (Always Use)**
```css
.glass-effect {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

**Critical Design Rules**
- **NEVER mention "AI" in user-facing text** - use "Smart Analysis" or "Intelligent"
- **NEVER use medical/hospital icons** 🏥 - use nature/wellness icons instead 🌱✨🪷
- **Instagram-Worthy Design**: Make interfaces users want to share
- **One-Thumb Operation**: All mobile interactions single-handed
- **3-Second Rule**: Instant gratification on all actions
- **Food Emojis**: Strategic usage for personality 🍽️📸⚡🌱👑

**Business Logic Integration**
- **Target**: 15% free-to-premium conversion rate
- **Include**: FOMO triggers, social proof, dopamine hits
- **Free Tier**: 14-day retention, basic nutrition, 3 analyses/day
- **Premium**: Unlimited storage, 6 analysis modes, USDA data

## Development Workflow

### 🚀 Git Branch & Commit Strategy (Conventional Commits)

**Branch Naming Convention**:
```bash
feat/meal-sharing          # New feature
fix/camera-permissions     # Bug fix
hotfix/payment-critical    # Urgent production fix
chore/update-dependencies  # Maintenance
docs/api-documentation     # Documentation
perf/optimize-images       # Performance
refactor/auth-context      # Code restructuring
test/add-export-tests      # Testing
style/update-buttons       # UI/styling only
```

**Commit Message Format**:
```bash
feat: add meal sharing functionality
fix: resolve iOS camera permission issue
hotfix: fix critical payment processing error
chore: update Next.js to 15.3.3
docs: add API endpoint documentation
perf: optimize image loading with lazy loading
refactor: simplify auth context logic
test: add tests for export feature
style: update button hover states
```

### 📋 Development Process

#### 1. **Start New Work**
```bash
# Always start from updated main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feat/export-pdf

# Add feature flag if needed
echo "NEXT_PUBLIC_FEATURE_EXPORT=true" >> .env.local
```

#### 2. **Development Testing**
```bash
# Test in development
npm run dev  # Keep running in separate terminal

# Before committing, always run:
npm run validate        # Lint, format, typecheck
npm run security:scan   # Check for exposed credentials
```

#### 3. **Production Parity Testing**
```bash
# CRITICAL: Test with production build locally
NODE_ENV=production npm run build
npm run start

# Verify:
# ✅ Feature still visible?
# ✅ No console errors?
# ✅ All functionality works?
```

#### 4. **Commit & Deploy**
```bash
# Commit with conventional format
git add .
git commit -m "feat: add PDF export for meal history"

# Push to create preview deployment
git push origin feat/export-pdf

# Vercel creates preview URL automatically
# Test on preview URL before merging!
```

#### 5. **Production Deployment**
```bash
# After PR approval and merge to main
# Vercel auto-deploys to production

# Verify deployment:
curl https://www.mealappeal.app/api/health
# Check specific feature on production
```

### 🛡️ Pre-Deployment Checklist

Before marking any feature as "ready":
- [ ] Works in `npm run dev`
- [ ] Works in `npm run build && npm run start`
- [ ] No hardcoded localhost URLs
- [ ] Feature flags added if needed
- [ ] Loading states implemented
- [ ] Error boundaries added
- [ ] Tested on Vercel preview URL
- [ ] Mobile responsive
- [ ] No console errors

### 🚦 Quick Reference

```bash
# New feature
git checkout -b feat/dark-mode
git commit -m "feat: add dark mode toggle"

# Bug fix
git checkout -b fix/mobile-auth
git commit -m "fix: resolve mobile login delay"

# Hotfix (urgent)
git checkout -b hotfix/payment-webhook
git commit -m "hotfix: fix Stripe webhook timeout"

# Always test production build before deploying!
npm run build && npm run start
```

### Starting Development
```bash
# 1. First-time setup or when things are broken
npm run setup           # Validates entire environment

# 2. Start development server (REQUIRED for testing!)
npm run dev            # Keep running in separate terminal

# 3. Before any commits
npm run security:scan  # Check for hardcoded credentials
npm run validate       # Run all code quality checks
```

### Testing Workflow
```bash
# Run all tests with detailed reporting
npm run test:all

# Check specific areas
npm run db:validate     # Database schema
npm run debug:login    # Auth flow
npm run health:check   # API status

# Review results
ls reports/            # JSON test reports
```

### When Things Go Wrong
```bash
# Nuclear reset option
npm run dev:reset      # Cleans everything and re-sets up

# Manual cleanup
npm run clean          # Remove old files
npm run clean:preview  # See what would be cleaned

# Check environment
npm run setup          # Re-validate configuration
```

## Common Issues & Solutions

**1. "Can't login/signup"**
- Check if profile exists in profiles table
- Run `npm run db:validate` to verify schema
- Common: User already exists - should LOGIN not SIGNUP
- Mobile: Clear browser cache after deployments

**2. "Analysis fails"**
- Verify OpenAI API key: `npm run setup`
- Check rate limits aren't exceeded
- Development: Mock data should work without API key
- Production: Check Sentry for detailed errors

**3. "Tests failing"**
- **CRITICAL**: Is `npm run dev` running in another terminal?
- Check environment: `npm run setup`
- Review detailed reports in `reports/` directory
- Try `npm run dev:reset` for clean slate

**4. "Database errors"**
- Run `npm run db:validate` to check schema
- Verify Supabase service role key is set
- Check if using correct column names (user_id not id)
- AuthContext has fallbacks for missing columns

**5. "Build/Deploy issues"**
- Build ignores TypeScript/ESLint errors (by design)
- Vercel environment variables must be set in dashboard
- Check function timeouts in vercel.json
- Logger must use console-only in production

## Security Reminders

1. **Never hardcode credentials** - use environment variables
2. **Run `npm run security:scan` before EVERY commit**
3. **All user inputs must be sanitized** - use validation schemas
4. **File names need sanitization** - prevent path traversal
5. **Keep production keys separate** - use .env.local

## Performance Optimization

- **Webpack chunking** configured for large libraries
- **Service worker** for offline (missing `/sw.js` needs creation)
- **Image optimization** disabled in Next.js (custom handling)
- **Lazy loading** implemented throughout
- **5-minute cache** on expensive operations

## Files Requiring Special Attention

**Critical API Routes**
- `/api/analyze-food/route.ts` - Main business logic (900+ lines)
- `/api/stripe/webhook/route.ts` - Payment processing
- `/api/health/route.ts` - System monitoring

**Core Infrastructure**
- `src/contexts/AuthContext.tsx` - Multi-layer fallback system
- `src/lib/database.ts` - Retry logic and pooling
- `src/lib/rate-limit.ts` - Distributed rate limiting
- `src/lib/validation.ts` - Security schemas

**Configuration Files**
- `vercel.json` - Timeouts and security headers
- `.env.example` - Comprehensive setup guide
- `scripts/test/run-all-tests.js` - Test orchestration

## MVP Launch Features

**Active Premium Features**
- Unlimited meal storage (vs 14-day retention)
- USDA scientific nutrition data
- 6 Advanced analysis modes
- Priority support
- Higher rate limits (100-200/hour vs 10/hour)

**Temporarily Excluded** (Post-MVP)
- Sharing features
- Export features

This simplified scope reduces complexity while maintaining clear value differentiation.

## Additional Development Commands

### Database Management
```bash
# Database-specific commands
npm run db:test           # Test database connectivity
npm run db:backup         # Create database backup
npm run db:restore        # Restore from backup
npm run db:dump           # Dump schema (scripts/db/dump-schema.js)
npm run db:validate       # Validate schema structure
```

### Monitoring & Debugging
```bash
# API and system monitoring
npm run api:test          # Test all API endpoints
npm run api:login         # Test login flow (scripts/test/test-login.js)
npm run api:food          # Test food analysis endpoint
npm run debug:env         # Debug environment variables
npm run debug:routes      # List all Next.js routes
```

### Build Analysis
```bash
# Build optimization commands
npm run analyze           # Analyze bundle size with @next/bundle-analyzer
npm run build:clean       # Clean build and rebuild
npm run build:static      # Export static site (if applicable)
```

## Key Implementation Patterns

### Error Handling Pattern
```typescript
// All API routes use this error handling pattern:
try {
  // Main logic
} catch (error) {
  logger.error('Operation failed', {
    error: error instanceof Error ? error.message : 'Unknown error',
    correlationId,
    // Include relevant context
  });
  
  // Always return graceful response
  return NextResponse.json(
    { error: 'User-friendly message' },
    { status: 500 }
  );
}
```

### Rate Limiting Implementation
```typescript
// Rate limit checks in every API route:
const rateLimitResult = await checkRateLimit(userId, tier);
if (!rateLimitResult.allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded', resetAt: rateLimitResult.resetAt },
    { status: 429 }
  );
}
```

### Database Query Pattern
```typescript
// All database operations use retry logic:
const result = await executeWithRetry(
  async () => {
    return await supabase
      .from('table')
      .select('*')
      .eq('column', value)
      .single();
  },
  { retries: 3, backoff: 'exponential' }
);
```

## Testing Strategy

### Test Organization
- Unit tests: In `scripts/test/unit/`
- Integration tests: In `scripts/test/integration/`
- E2E tests: In `scripts/test/e2e/`
- All tests run via `npm run test:all`

### Test Data
- Test users created with `npm run debug:signup`
- Mock data available in development mode
- Test environment uses separate Supabase project

## Deployment Pipeline

### Pre-deployment Steps
1. `npm run validate` - Ensure code quality
2. `npm run security:scan` - Check for credentials
3. `npm run test:all` - Run full test suite
4. `npm run build` - Test production build locally

### Vercel Configuration
- Automatic deployments on push to main
- Preview deployments for all PRs
- Environment variables set in Vercel dashboard
- Function timeout: 60 seconds (configured in vercel.json)

### Post-deployment Verification
```bash
# Verify production deployment
curl https://www.mealappeal.app/api/health
npm run api:test -- --env=production
```

## Monitoring & Observability

### Logging Strategy
- Development: Full Winston logging to files
- Production: Console-only (Vercel limitation)
- Correlation IDs for request tracking
- Structured logging with context

### Error Tracking
- Sentry integration for production errors
- Custom error boundaries in React
- API error standardization
- User-friendly error messages

### Performance Monitoring
- Vercel Analytics for web vitals
- Custom timing metrics in API routes
- Database query performance tracking
- Rate limit metrics in Redis

## Navigation Optimization Hypothesis (June 16, 2025)

### Hypothesis: "Camera-First Navigation Drives 3x Engagement"

**Core Changes Implemented:**
1. **Camera as Primary Action** - Moved to first position with "Snap" label
2. **Streak System** - Visible progress tracking with badges
3. **Dynamic Feedback** - Micro-animations, haptic feedback, glow effects
4. **Scarcity Indicators** - "X/3 analyses left" for free users
5. **Premium Visual Cues** - Crown icons, gradient effects

**Expected Outcomes:**
- Camera tap rate: +300%
- Daily active usage: +50%
- Session duration: +40%
- Premium conversion entry: +25%
- 7-day retention: +35%

### Testing Protocol

**A. Mobile Navigation Testing (Primary Focus)**
```bash
# 1. Start development server
npm run dev

# 2. Open in mobile browser or device emulator
# Chrome DevTools: Toggle device toolbar (Ctrl+Shift+M)
# Test on: iPhone 12 Pro, Samsung Galaxy S21

# 3. Test Navigation Elements:
- [ ] Bottom nav visible and reachable with thumb
- [ ] Camera button has subtle pulse animation
- [ ] Tap provides haptic feedback (real device)
- [ ] Active state shows green glow
- [ ] Badges display correctly (streak, analyses)
- [ ] Crown appears for premium users
- [ ] Free tier limit warning at 0/3 analyses

# 4. Test User Flows:
- [ ] New user: Camera prominent, "NEW" badge on Feed
- [ ] Returning user: Streak badge shows count
- [ ] Free user at limit: Upgrade prompt appears
- [ ] Premium user: Crown on profile, no limits
```

**B. Engagement Metrics to Track**
```javascript
// Add to your analytics tracking:
// Navigation tap events
track('nav_tap', {
  item: 'camera|feed|streaks|profile',
  badge_shown: true/false,
  user_tier: 'free|premium',
  streak_count: number,
  analyses_left: number
})

// Conversion funnel
track('upgrade_prompt_shown', {
  trigger: 'daily_limit_reached',
  location: 'bottom_nav'
})
```

**C. Quick Validation Tests**
```bash
# Test streak persistence
1. Analyze a meal
2. Check streak badge shows "1"
3. Refresh page - streak should persist
4. Check localStorage:
   - Open DevTools Console
   - Run: localStorage.getItem('mealappeal_streak')

# Test daily limit
1. As free user, analyze 3 meals
2. Bottom nav should show "0/3"
3. Upgrade prompt should appear
4. Camera still accessible but shows limit

# Test responsive design
1. Resize browser width
2. At <768px: Bottom nav visible
3. At >768px: Bottom nav hidden
4. Navigation items in top bar
```

**D. Performance Validation**
```bash
# Check animation performance
1. Open DevTools Performance tab
2. Record while tapping navigation
3. FPS should stay above 30
4. No jank in animations

# Bundle size impact
npm run analyze
# Navigation changes should add <5KB
```

**E. Success Criteria**
- [ ] All navigation items respond in <100ms
- [ ] Animations run at 60fps on mid-range devices
- [ ] No layout shift when badges appear
- [ ] Upgrade prompts non-intrusive but visible
- [ ] Works offline (cached assets)

### Rollback Plan
If metrics decline:
1. Bottom nav items can be reordered via `BottomNavigation.tsx`
2. Animations can be disabled by removing CSS classes
3. Streak system can be hidden by removing badge prop
4. Original navigation order in git history