# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MealAppeal Overview

MealAppeal is an AI-powered food analysis SaaS application with a freemium business model. It allows users to photograph their meals and receive instant nutrition insights, targeting health-conscious users who want premium nutrition analysis and social food sharing capabilities.

## Common Development Commands

```bash
# Development
npm run dev              # Start Next.js development server (http://localhost:3000)

# Build & Production
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check formatting
npm run typecheck       # TypeScript type checking
npm run validate        # Run all checks (lint, format, typecheck)
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI Vision API (gpt-4o-mini-2024-07-18) - currently mocked
- **Payments**: Stripe subscriptions ($4.99/month, $49.99/year)
- **Styling**: Glass morphism UI with gradient branding (green-orange)

### Key Architectural Patterns

1. **Authentication Flow**
   - Supabase Auth with OAuth support
   - Global auth state via AuthContext (`src/contexts/AuthContext.tsx`)
   - Profile-based subscription management
   - Row Level Security (RLS) for data protection

2. **Database Schema**
   - `profiles`: User data with subscription tiers (free, premium_monthly, premium_yearly)
   - `meals`: Food analysis data with 14-day retention for free users
   - Automatic meal count triggers for profile updates

3. **Core Features**
   - Camera capture with real-time preview (`src/app/camera/page.tsx`)
   - AI food analysis (currently mocked in `src/app/api/analyze-food/route.ts`)
   - Meal dashboard with calendar views (`src/app/meals/page.tsx`)
   - Stripe subscription management (`src/app/api/stripe/*`)

4. **State Management**
   - Global: AuthContext for user/auth state
   - Component: useState for UI interactions
   - Data: Direct Supabase queries with 5-minute caching
   - Navigation: Next.js App Router

### Business Logic

**Free Tier Limitations:**
- 14-day meal storage
- 3 monthly shares
- Basic nutrition info only

**Premium Features:**
- Unlimited storage & shares
- Advanced nutrition analysis
- 6 AI analysis modes
- Priority support

### Design System Requirements
- Mobile-first PWA design
- One-thumb operation
- Glass effect cards (`.glass-effect`)
- Gradient buttons and backgrounds
- Food emojis for engagement (🍽️ 📸 📤 ⏳ 🌱 👑)
- Celebration animations
- 3-second instant gratification rule

### Performance Targets
- <2 second load times
- Core Web Vitals compliance
- Image optimization with lazy loading
- Efficient Supabase queries

### Security Considerations
- Environment validation in `src/lib/env-validation.ts`
- Supabase RLS policies
- Stripe webhook verification
- Bearer token authentication for API routes

## Development Notes

1. **Mock AI Analysis**: The food analysis is currently mocked. To integrate real OpenAI:
   - Update `src/app/api/analyze-food/route.ts`
   - Ensure OPENAI_API_KEY is set
   - Follow the existing response format

2. **Supabase Setup**: 
   - Run migrations in `supabase/migrations/`
   - Configure auth providers in Supabase dashboard
   - Set up storage buckets for meal images

3. **Stripe Integration**:
   - Configure products in Stripe dashboard
   - Set webhook endpoint to `/api/stripe/webhook`
   - Update price IDs in upgrade flows

4. **Testing Approach**: No test framework is currently configured. When implementing tests, check package.json for the testing setup first.