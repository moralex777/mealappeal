# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Advanced Claude Code Practices

### Power Commands & Prompting
- **Ultra think**: `"Ultra think through [complex task]"` - Triggers deep reasoning with sub-agents
- **Architecture mode**: `"Architect and implement [feature]"` - Plans before building
- **CEO workflow**: `"Design 5-stage plan"` → `"Execute stage 1 like a 10x engineer"`
- **Stop-and-go**: `"Complete task 1.1, then STOP"` - Atomic execution with review points
- **Investigation only**: `"Investigate WITHOUT implementing"` - Analysis without code changes

### Three-Mode Development
1. **Plan mode** (Shift+Tab+Tab): Architecture decisions, spec creation
2. **Default mode**: Review each action, critical business logic
3. **Auto-accept mode**: Trusted repetitive tasks (mkdir, npm install)

### Advanced Patterns
- **Self-review**: Build with Sonnet → Review with Opus → Refine
- **Infinite loops**: `/infinite @spec @output N` - Generate N variations in parallel
- **Fire-and-forget**: `claude -p "task"` - Background execution
- **Multi-agent**: Orchestrate multiple Claude instances for parallel work

### Session Management
- Start: `/session-start "Building camera feature"`
- Update: `/session-update "Fixed iOS rotation issue"`
- End: `/session-end` - Generates comprehensive documentation
- Find: `/session-find "camera rotation"` - Search previous solutions

### Key Shortcuts
- **ESC twice**: Edit previous prompts
- **ESC**: Interrupt mid-execution
- **Ctrl+R**: View execution logs

## MealAppeal Overview

MealAppeal is a production SaaS application (https://www.mealappeal.app) for smart nutrition analysis. Users photograph meals to receive instant AI-powered nutrition insights with a freemium subscription model.

**Tech Stack**: Next.js 15.3.2, Supabase, OpenAI Vision API, Stripe, React 19, TypeScript, Tailwind CSS v4

## Personal Interaction Guidelines

- Call me Alex, when something serious happens - you can call me Alexander

## Essential Commands

```bash
# Initial Setup & Development
npm run setup           # Validates environment and creates .env.local
npm run dev             # Start dev server on http://localhost:3004

# Before Every Commit
npm run security:scan   # CRITICAL: Check for hardcoded credentials
npm run validate        # Run lint, format, and typecheck

# Testing
npm run test:all        # Run comprehensive test suite
npm run test:image-storage  # Test image storage system
npm run db:validate     # Validate database schema

# Production Testing
npm run build && npm run start  # ALWAYS test production build locally

# Debugging
npm run dev:reset       # Nuclear option when stuck
npm run debug:login     # Test authentication flow
npm run debug:signup    # Create test users with premium

# Admin Management
npm run admin:list      # List admin emails
npm run admin:add email@example.com  # Add admin access
```

## High-Level Architecture

### API Route Pattern (All Routes Follow This)
```typescript
// 1. Security headers and CORS
// 2. Zod validation on inputs
// 3. Rate limiting check (Redis/Upstash)
// 4. Correlation ID for tracking
// 5. Try-catch with structured logging
// 6. Graceful fallback responses
```

### Multi-Layer Authentication System
The `AuthContext` implements a bulletproof fallback system:
1. Try full profile query with all columns
2. Fall back to basic query if columns missing
3. Create in-memory profile if database fails
4. Async database profile creation attempt

This prevents registration failures from schema mismatches.

### Food Analysis Pipeline
```
Image → Validation → Rate Limit → OpenAI Vision → USDA Enhancement → Cache → Database
```
- Tier-based rate limits: Free (10/hr), Premium (100-200/hr)
- Smart caching for common foods (30 min)
- Mock data fallback in development

### Database Operations Pattern
All database operations use:
- Retry logic: 3 attempts with exponential backoff
- AbortSignal timeouts (2-10 seconds)
- Connection pooling for serverless
- Never block user actions on failures

## Critical Production Learnings

1. **Vercel Limitations**: Cannot write log files - use console.log only
2. **Mobile Auth**: Must call `refreshSession()` before navigation
3. **Image Storage**: Use TEXT not VARCHAR(50000) - prevents truncation
4. **Profile Lookups**: Use `user_id` NOT `id` field
5. **Build Process**: Ignores TypeScript/ESLint errors by design

## Design System Rules

- **Glass Morphism** everywhere: `background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px);`
- **Never mention "AI"** - use "Smart Analysis" or "Intelligent"
- **No medical icons** 🏥 - use nature/wellness 🌱✨🪷
- **Mobile-first**: Bottom nav, one-thumb operation
- **Food emojis**: Strategic usage for personality 🍽️📸⚡

## Task Management

Use `/TODO.md` for all tasks:
- Update BEFORE starting work (mark "In Progress")
- Update AFTER completing (mark "Completed" with notes)
- Include file paths for all modifications
- Document blockers and discoveries

## Development Workflow

1. **Start from main**: `git checkout main && git pull`
2. **Feature branch**: `git checkout -b feat/your-feature`
3. **Test locally**: `npm run dev` + `npm run validate`
4. **Test production**: `npm run build && npm run start`
5. **Security check**: `npm run security:scan`
6. **Push for preview**: `git push origin feat/your-feature`

## Key Files & Their Purposes

**Critical API Routes**:
- `/api/analyze-food/route.ts` - Core business logic (900+ lines)
- `/api/stripe/webhook/route.ts` - Payment processing
- `/api/health/route.ts` - System monitoring

**Core Infrastructure**:
- `src/contexts/AuthContext.tsx` - Multi-layer auth fallbacks
- `src/lib/database.ts` - Retry logic and pooling
- `src/lib/rate-limit.ts` - Redis-based rate limiting
- `src/lib/validation.ts` - Zod schemas and sanitization

**Configuration**:
- `.env.example` - Complete environment template
- `vercel.json` - Deployment and security headers
- `package.json` - All npm scripts documented

## Common Issues & Solutions

**"Can't login/signup"**
- Check profiles table for user
- Run `npm run db:validate`
- Clear browser cache on mobile

**"Tests failing"**
- Ensure `npm run dev` is running in another terminal
- Try `npm run dev:reset` for clean slate

**"Database errors"**
- AuthContext has fallbacks for missing columns
- Check using `user_id` not `id`

## OpenAI Integration

Currently all tiers use `gpt-4o-mini-2024-07-18`. Configuration:
- Temperature: 0.3 (balance consistency/variety)
- Seed: 42 (reproducible results)
- Premium: 2000 tokens, "high" detail
- Free: 500 tokens, "low" detail

Monitor deprecations weekly: `npm run check:model-deprecation`

## Security Reminders

1. **Always run** `npm run security:scan` before commits
2. **Never hardcode** credentials - use environment variables
3. **Sanitize inputs** - validation schemas handle this
4. **File names** need sanitization for path traversal

## Performance Notes

- Service worker needs creation for offline (`/sw.js`)
- 5-minute cache on expensive operations
- Lazy loading implemented throughout
- Image optimization disabled in Next.js (custom handling)

## Admin Access

Dashboard at `/admin` - restricted to configured emails.
Current admins in `/src/lib/admin-config.ts`.
Manage with `npm run admin:list` and `npm run admin:add`.

## Weekly Maintenance

Run every Monday:
```bash
npm run weekly:maintenance  # Checks AI updates & runs tests
npm run admin:review       # Review metrics
```

Critical: Monitor OpenAI deprecations (powers core functionality).
```