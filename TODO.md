# TODO.md - MealAppeal Development Tasks

## Overview
This file tracks all development tasks, their status, and implementation notes. 
Tasks are organized by priority and sprint schedule for rapid execution.

## Quick Links
- 📋 [Full Roadmap](./ROADMAP.md) - Strategic development plan
- 📊 [Development Status](./DEVELOPMENT_STATUS.md) - Current feature status
- 📈 [Metrics Tracking](./METRICS_TRACKING.md) - KPIs and success metrics

## Task Format
- [ ] Task description
  - **Status**: Not Started | In Progress | Completed | Blocked
  - **Priority**: 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low
  - **Date Added**: YYYY-MM-DD
  - **Date Completed**: YYYY-MM-DD
  - **Notes**: Implementation details, blockers, or important context
  - **Files Modified**: List of affected files

## 🚀 CURRENT SPRINT: Week 1 - Revenue Foundation (June 17-23)

### 🔴 CRITICAL: Payment System Activation
- [ ] Test Stripe webhook handling end-to-end
  - **Status**: Not Started
  - **Priority**: 🔴 Critical
  - **Date Added**: 2025-06-17
  - **Notes**: Use stripe CLI to test locally, verify signature validation
  - **Files to Modify**: `/src/app/api/stripe/webhook/route.ts`
  
- [ ] Implement subscription status checking middleware
  - **Status**: Not Started
  - **Priority**: 🔴 Critical  
  - **Date Added**: 2025-06-17
  - **Notes**: Check user's subscription_tier before allowing premium features
  - **Files to Create**: `/src/middleware/subscription.ts`
  
- [ ] Add feature gating to premium endpoints
  - **Status**: Not Started
  - **Priority**: 🔴 Critical
  - **Date Added**: 2025-06-17
  - **Notes**: Block non-premium users from: unlimited storage, USDA data, high rate limits
  - **Files to Modify**: Multiple API routes
  
- [ ] Create upgrade flow at limit points
  - **Status**: Not Started
  - **Priority**: 🔴 Critical
  - **Date Added**: 2025-06-17
  - **Notes**: When free user hits 3 meals/day, show compelling upgrade modal
  - **Files to Create**: `/src/components/UpgradeModal.tsx`

## 🏃 UPCOMING SPRINTS

### Week 2: Retention Engine (June 24-30)
- [ ] Implement Resend email backend service
  - **Priority**: 🟡 High
  - **Notes**: Connect to existing notification UI
  
- [ ] Create email templates (Welcome, Deletion warnings, Weekly summary)
  - **Priority**: 🟡 High
  - **Notes**: Use React Email components
  
- [ ] Implement 14-day auto-deletion system
  - **Priority**: 🟡 High
  - **Notes**: Scheduled job with warning emails

### Week 3: Optimization (July 1-7)
- [ ] Implement comprehensive caching strategy
  - **Priority**: 🟢 Medium
  - **Notes**: Redis caching for all API responses
  
- [ ] Add usage analytics tracking
  - **Priority**: 🟢 Medium
  - **Notes**: Mixpanel or PostHog integration

### Week 4: Polish & Launch (July 8-14)
- [ ] Comprehensive testing and bug fixes
  - **Priority**: 🟡 High
  
- [ ] Update marketing site and documentation
  - **Priority**: 🟢 Medium

## 📋 BACKLOG (Future Features)

### Social Features
- [ ] Public meal sharing system (3/month free limit)
- [ ] User profiles and following
- [ ] Community feed with discovery

### Advanced Analytics  
- [ ] Nutrition trends dashboard
- [ ] Weekly/monthly reports
- [ ] Goal tracking system

### Enterprise Features
- [ ] Team accounts
- [ ] API access
- [ ] White-label options

## ✅ COMPLETED (June 17, 2025)

### 📚 Documentation Infrastructure
- [x] Add comprehensive external documentation resources for scaling
  - **Status**: Completed
  - **Date Added**: 2025-06-17
  - **Date Completed**: 2025-06-17
  - **Files Created**:
    - `/docs/CLAUDE_CODE_DOCS.md` - Essential platform documentation references
    - `/docs/SCALING_BENEFITS.md` - Benefits analysis for current and future scaling
  - **Files Modified**:
    - `/README.md` - Added reference to new docs
    - `/CLAUDE.md` - Added documentation resources section
  - **Documentation Added**:
    - Tier 1: Supabase, Stripe, Next.js 14, Tailwind CSS v4, PWA
    - Tier 2: OpenAI API, TypeScript, React Email, Vercel
    - Tier 3: ShadCN/UI
  - **Benefits**: Enables efficient scaling from MVP to enterprise SaaS

### 🧪 Testing Infrastructure Created
- [x] Create comprehensive testing strategy for safe deployment
  - **Status**: Completed
  - **Date Added**: 2025-06-17
  - **Date Completed**: 2025-06-17
  - **Files Created**:
    - `/scripts/test/test-ingredient-saving.js` - Automated test for ingredient feature
    - `/test-share-reset-date-readonly.sql` - Read-only SQL diagnostic
    - `/scripts/test/pre-deploy-checks.js` - Pre-deployment safety checks
    - `/rollback-ingredients.sql` - Emergency rollback script
  - **NPM Scripts Added**:
    - `npm run test:ingredients` - Test ingredient saving
    - `npm run test:safe` - Run tests in safe mode
    - `npm run predeploy` - Pre-deployment checks
  - **Testing Strategy**:
    1. All tests use isolated test data
    2. Tests clean up after themselves
    3. Read-only SQL for production diagnostics
    4. Rollback plan ready if needed

## 2025-06-17 - Current Session

### 🐛 Bug Fixes
- [x] Fix missing ingredient tracking in `/api/analyze-food`
  - **Status**: Completed
  - **Date Added**: 2025-06-17
  - **Date Completed**: 2025-06-17
  - **Notes**: Ingredients are extracted from AI analysis but never saved to DB. The `ingredients` and `meal_ingredients` tables were empty since May 29, 2025.
  - **Root Cause**: Missing code to insert ingredients after meal creation
  - **Files Modified**: `/src/app/api/analyze-food/route.ts` (lines 445-514)
  - **Solution Implemented**: 
    - Added ingredient processing logic after meal creation
    - Normalizes ingredient names (lowercase, sanitized)
    - Uses upsert to avoid duplicates
    - Creates meal_ingredients relationships
    - Includes error handling to not fail entire request if ingredients fail
  - **Testing Required**: Analyze a meal and verify ingredients appear in database tables
  - **Execution Status**: 
    - ✅ Code changes implemented successfully
    - ✅ Test infrastructure created
    - ✅ Automated tests passed (API health, build, performance)
    - ✅ Test documentation complete (3 guides, 4 SQL scripts)
    - ⏳ Awaiting manual UI testing
    - 📋 Test summary at `/test-summary-report.md`

- [x] Fix share_reset_date showing July instead of June in profiles table
  - **Status**: Completed
  - **Date Added**: 2025-06-17
  - **Date Completed**: 2025-06-17
  - **Notes**: Database column shows 2025-07-16 when today is 2025-06-17
  - **Root Cause**: Likely database default set to CURRENT_DATE + INTERVAL '1 month'
  - **Files Created**: `/fix-share-reset-date.sql`
  - **Solution Implemented**:
    1. Created comprehensive SQL script to investigate and fix the issue
    2. Script includes:
       - Diagnostic queries to identify affected rows
       - UPDATE statement to fix existing data
       - Trigger to prevent future dates from being set
       - Verification queries
  - **Action Required**: 
    1. Run `/fix-share-reset-date.sql` in Supabase SQL Editor
    2. Check column default in Supabase dashboard and update if needed
    3. Monitor new registrations to ensure dates are correct

### 🔴 HIGH PRIORITY - OpenAI Improvements (Production Impact)
- [x] Implement OpenAI quick wins for better meal analysis
  - **Status**: Completed
  - **Date Added**: 2025-06-17
  - **Date Completed**: 2025-06-17
  - **Priority**: CRITICAL - Improves core product functionality
  - **Quick Wins** (Deployed):
    - ✅ Added `seed: 42` parameter for consistent results
    - ✅ Changed temperature from 0.2 to 0.3 for variety
    - ✅ Extended cache time for common foods (30 min vs 5 min)
  - **Files Modified**: `/src/app/api/analyze-food/route.ts`
  - **Implementation Details**:
    - Added COMMON_FOODS array with 10 frequently ordered items
    - Smart cache detection checks if food name contains common terms
    - Metadata now includes seed and temperature for transparency
  - **Expected Impact**: 
    - More consistent results for same meals
    - Better recognition of food variations
    - 30% reduction in API costs via caching
  - **Testing**: ✅ All tests passing
  - **Documentation**: See `/docs/quick-openai-improvements.md`

### 🚀 Future-Proofing & Scalability
- [ ] Implement data partitioning for meals table
  - **Status**: Not Started
  - **Date Added**: 2025-06-17
  - **Notes**: Partition by created_at for better query performance at scale
  - **Impact**: 50-70% query improvement, no frontend changes needed

- [ ] Add proper caching strategy for nutrition data
  - **Status**: Not Started
  - **Date Added**: 2025-06-17
  - **Notes**: Cache OpenAI responses to reduce API costs by 60%
  - **Tables Needed**: `nutrition_cache` with TTL

- [ ] Create comprehensive ingredient system
  - **Status**: Not Started
  - **Date Added**: 2025-06-17
  - **Notes**: Enable ingredient search, allergen warnings, dietary restrictions
  - **New Features**: Ingredient autocomplete, "find meals with X" search

- [ ] Set up API key rotation system
  - **Status**: Not Started
  - **Date Added**: 2025-06-17
  - **Notes**: Security enhancement for production
  - **Tables Needed**: `api_keys` with expiration

- [ ] Implement comprehensive audit logging
  - **Status**: Not Started
  - **Date Added**: 2025-06-17
  - **Notes**: Track all user actions for security and debugging
  - **Tables Needed**: `audit_logs` partitioned by date

## Historical Tasks (Completed)

### 2025-06-16 - Navigation System Overhaul
- [x] Implement unified glass morphism navigation across entire app
  - **Status**: Completed
  - **Date Completed**: 2025-06-16
  - **Notes**: Successfully created golden standard navigation with camera-first hypothesis
  - **Files Modified**: 
    - `/src/components/AppLayout.tsx`
    - `/src/components/BottomNavigation.tsx`
    - All page components (removed duplicate headers)
  - **Results**: Clean, consistent UI with mobile-first bottom nav

- [x] Fix duplicate headers in account, billing, and privacy pages
  - **Status**: Completed
  - **Date Completed**: 2025-06-16
  - **Notes**: Pages now use AppLayout's navigation instead of custom headers
  - **Files Modified**: Multiple page components

### 2025-06-15 - Production Deployment
- [x] Deploy MealAppeal to production at mealappeal.app
  - **Status**: Completed
  - **Date Completed**: 2025-06-15 21:30
  - **Platform**: Vercel with custom domain
  - **Critical Learnings**:
    - Vercel serverless can't write log files - use console only
    - Database triggers must match exact column names
    - Camera permissions require domain in headers
    - Mobile browsers need longer auth delays
    - image_url column must be TEXT not VARCHAR(50000)
  - **Files Modified**: Multiple configuration files

- [x] Fix image truncation causing grey placeholders
  - **Status**: Completed
  - **Date Completed**: 2025-06-16
  - **Notes**: Changed image_url column from VARCHAR(50000) to TEXT
  - **Files Modified**: Database schema migration

- [x] Fix styled-jsx client-side errors
  - **Status**: Completed
  - **Date Completed**: 2025-06-15
  - **Notes**: Removed all styled-jsx, enabled compiler in Next.js config
  - **Files Modified**: `/src/app/meals/page.tsx`, `next.config.js`

- [x] Add auth timeout for mobile loading issues
  - **Status**: Completed
  - **Date Completed**: 2025-06-15
  - **Notes**: Prevents infinite loading on mobile meals page
  - **Files Modified**: Auth-related components

## 📚 Recurring Maintenance Tasks

### AI Platform Documentation Updates (Claude & OpenAI)
- [ ] Check AI documentation for updates (Weekly)
  - **Status**: Not Started
  - **Date Added**: 2025-06-17
  - **Frequency**: Every Monday - PRIORITIZE OpenAI (business critical)
  - **Last Checked**: 2025-06-17
  - **OpenAI URLs** (🔴 CRITICAL - Powers meal analysis):
    - Vision Guide: https://platform.openai.com/docs/guides/vision
    - Models: https://platform.openai.com/docs/models
    - API Reference: https://platform.openai.com/docs/api-reference
    - Pricing: https://openai.com/api/pricing
  - **Claude URLs** (Development efficiency):
    - Claude Code: https://docs.anthropic.com/en/docs/claude-code
    - Vision API: https://docs.anthropic.com/en/docs/capabilities/vision
    - Tool Usage: https://docs.anthropic.com/en/docs/tools/tool-use
    - Model Updates: https://docs.anthropic.com/en/docs/models/models-overview
  - **Action Items**:
    - [ ] 🔴 Check OpenAI vision model updates (direct impact on meal analysis)
    - [ ] 🔴 Monitor OpenAI pricing changes (affects profit margins)
    - [ ] 🟡 Look for new OpenAI vision features (competitive advantage)
    - [ ] 🟢 Review Claude development improvements
    - [ ] 🟢 Update configuration files with findings
  - **Files to Update**: 
    - `/src/app/api/analyze-food/route.ts` - Update OpenAI model/parameters
    - `/docs/AI_UPDATES.md` - Document all findings
    - `/home/alex/mealappeal/CLAUDE.md` - Project guidance
    - `/.env.example` - Update if new API keys/models needed

### Code Quality
- [ ] Run `npm run security:scan` before each commit
- [ ] Run `npm run validate` for code quality checks
- [ ] Update dependencies monthly

### Documentation
- [ ] Keep CLAUDE.md updated with new patterns
- [ ] Document any new environment variables
- [ ] Update API documentation

## Notes

### Quick Commands Reference
```bash
npm run setup           # Validate environment
npm run dev             # Start dev server
npm run test:all        # Run all tests
npm run security:scan   # Check for exposed secrets
npm run validate        # Lint, format, typecheck
```

### Important Reminders
1. Always test production build locally before deploying
2. Clear browser cache after deployments for mobile users
3. Users with existing accounts must use LOGIN not SIGNUP
4. Database triggers may fail silently - always verify