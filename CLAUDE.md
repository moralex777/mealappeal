# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MealAppeal Overview

MealAppeal is an AI-powered nutrition analysis SaaS application built with Next.js and Supabase. Users photograph meals to receive instant nutrition insights through OpenAI Vision API integration, with a freemium subscription model targeting health-conscious consumers.

## Common Development Commands

```bash
# Development
npm run dev              # Start Next.js development server (http://localhost:3000)
                        # IMPORTANT: Always run in separate terminal for testing!

# Build & Production  
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues automatically
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run typecheck       # Run TypeScript type checking
npm run validate        # Run all checks (lint, format, typecheck)
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.3.2 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage), Edge Functions
- **AI**: OpenAI Vision API (gpt-4o-mini-2024-07-18) with USDA nutrition enhancement
- **Payments**: Stripe subscriptions (Premium Monthly $19.99, Premium Yearly $199)
- **UI**: Radix UI components with glass morphism design system
- **PWA**: Service workers, offline functionality, mobile-first responsive design

### Key Architectural Patterns

**1. Authentication & User Management**
- Supabase Auth with email/OAuth (Google, GitHub) via `AuthContext`
- Automatic profile creation on signup with database triggers
- Row Level Security (RLS) policies for data protection
- JWT tokens managed by `@supabase/auth-helpers-nextjs`

**2. Subscription & Business Logic**
- Three tiers: Free, Premium Monthly, Premium Yearly
- Feature gating based on `subscription_tier` in profiles table
- Stripe webhooks handle subscription state changes at `/api/stripe/webhook`
- Free tier: 14-day retention, basic nutrition only
- Premium: Unlimited storage, advanced AI analysis modes, priority support

**3. Food Analysis Pipeline**
```
Image Capture → Base64/File Upload → OpenAI Vision API → USDA Enhancement → Database Storage
```
- Rate limiting: Free (10/hour), Premium Monthly (100/hour), Premium Yearly (200/hour) 
- Response caching (5-minute TTL) and fallback systems
- Supabase Storage with image optimization and thumbnail generation
- Comprehensive error handling with graceful degradation

**4. Database Schema**
- `profiles`: User data with subscription info, meal counts
- `meals`: Food analysis results with nutrition data and metadata
- `notification_settings`: User notification preferences
- `analytics_events`: User behavior tracking for optimization
- Automatic triggers for meal count updates and data retention

### Critical Implementation Details

**Authentication Context (`src/contexts/AuthContext.tsx`)**
- **Database Fallback System**: Handles missing database columns gracefully
- If billing_cycle/subscription columns missing, provides safe defaults
- Creates in-memory profiles when database profile doesn't exist
- Essential for new user registration flow stability

**API Route Structure**
- `/api/analyze-food`: Main AI analysis endpoint with tier-based processing
- `/api/stripe/*`: Payment processing (checkout, webhook, portal)
- All routes implement proper error handling and environment validation

**Mobile-First PWA Features**
- Device detection with QR code handoff for desktop-to-mobile workflow
- Service worker for offline functionality and background sync
- Installation prompts for iOS/Android with platform-specific guidance
- Analytics tracking for cross-device user journeys

### UI/UX Design System

**Glass Morphism Pattern**
```css
background: 'rgba(255, 255, 255, 0.95)'
backdropFilter: 'blur(12px)'
boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
```

**Color Scheme**
- Primary gradient: `linear-gradient(135deg, #10b981 0%, #ea580c 100%)`
- Green emphasis: `#16a34a` (success, health)
- Orange emphasis: `#ea580c` (energy, engagement)
- Glass backgrounds with consistent opacity levels

**Component Standards**
- Mobile-first responsive design with one-thumb operation
- Smooth animations (0.3s transitions) for all interactive elements
- Food emojis for engagement (📸 🎉 ⚡ 🔍)
- Consistent navigation across all pages via `Navigation` component

## Critical Development Notes

**1. Database Schema Compatibility**
The AuthContext includes robust fallback handling for database schema mismatches:
- Missing columns are handled with default values
- Prevents blocking errors during user registration
- Multiple query fallback layers for production stability

**2. Error Recovery Systems**
- AI analysis has multiple fallback layers (OpenAI → mock data → cached responses)
- Storage upload failures fall back to base64 encoding
- Missing environment variables trigger graceful degradation
- Comprehensive null/undefined checks throughout components

**3. Performance Requirements**
- Images compressed to <500KB with quality optimization
- Rate limiting prevents API abuse and controls costs
- Response caching reduces OpenAI API calls
- Lazy loading and code splitting for optimal load times

**4. Security Implementation**
- All user inputs validated with Zod schemas
- Supabase RLS policies protect user data
- Stripe webhook signature verification
- Environment variable validation in all API routes

## Testing & Validation

**Database Testing Scripts**
- `check-actual-schema.js`: Validates actual vs expected database schema
- `test-billing-cycle-fix.js`: Tests database fallback mechanisms
- Various integration test scripts for core functionality

**Manual Testing Checklist**
**PREREQUISITE: Always run `npm run dev` in separate terminal before testing!**
1. New user registration → login → camera analysis flow
2. Subscription upgrade/downgrade workflows
3. Mobile camera functionality and image processing
4. Error handling under various failure conditions

## Environment Configuration

**Required Environment Variables**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

**Optional Enhancements**
```
USDA_API_KEY=           # Enhanced nutrition data
RESEND_API_KEY=         # Transactional emails
```

## Common Issues & Solutions

**1. New User Registration Fails**
- Check AuthContext fallback system for missing database columns
- Verify profile creation trigger in Supabase
- Ensure RLS policies allow profile creation

**2. AI Analysis Errors**
- Verify OpenAI API key and rate limits
- Check image processing and compression
- Review fallback mock data systems

**3. Subscription Flow Issues**
- Validate Stripe webhook configuration
- Check price IDs match Stripe dashboard
- Verify subscription status updates in database

**4. Mobile/PWA Problems**
- Test service worker registration
- Verify manifest.json configuration
- Check camera permissions and device detection