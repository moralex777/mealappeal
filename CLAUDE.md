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
- **Frontend**: Next.js 15.3.2 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI Vision API (gpt-4o-mini-2024-07-18) - currently mocked
- **Payments**: Stripe subscriptions ($4.99/month, $49.99/year)
- **Styling**: Glass morphism UI with gradient branding (green-orange)
- **UI Components**: Radix UI via ShadCN (42 components installed - see COMPONENTS.md)
- **Email**: Resend for transactional emails

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
   - `notification_settings`: Email and push notification preferences

3. **Core Features**
   - Camera capture with real-time preview (`src/app/camera/page.tsx`)
   - AI food analysis (currently mocked in `src/app/api/analyze-food/route.ts`)
   - Meal dashboard with calendar views (`src/app/meals/page.tsx`)
   - AI Analysis Modes accordion (`src/components/AIAnalysisModes.tsx`) - 6 analysis types with glass morphism UI
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
- Glass effect cards with inline styles (consistent `rgba(255, 255, 255, 0.8)` + `backdrop-filter: blur(8px)`)
- Gradient buttons and backgrounds (green-orange theme: `#10b981` to `#ea580c`)
- Food emojis for engagement (🍽️ 📸 📤 ⏳ 🌱 👑)
- Celebration animations with CSS keyframes
- 3-second instant gratification rule
- Smooth accordion animations (expandDown, fadeInUp transitions)
- Conversion psychology: FOMO triggers, social proof, urgency indicators
- Habit-forming features: Daily streaks, notifications, rewards

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

1. **Production AI Analysis**: Real OpenAI Vision API + USDA nutrition data integration:
   - OpenAI GPT-4o-mini-2024-07-18 for food recognition and analysis
   - USDA FoodData Central API for accurate nutrition data
   - Rate limiting (10 req/hour for free users, unlimited for premium)
   - Tier-based analysis: Basic nutrition for free, 6 detailed modes for premium
   - Response caching and graceful error handling

2. **Supabase Setup**: 
   - Run migrations in `supabase/migrations/`
   - Configure auth providers in Supabase dashboard
   - Set up storage buckets for meal images

3. **Stripe Integration**:
   - Configure products in Stripe dashboard
   - Set webhook endpoint to `/api/stripe/webhook`
   - Update price IDs in upgrade flows
   - Enable webhook events: `checkout.session.completed`, `customer.subscription.*`

4. **Testing Approach**: No test framework is currently configured. When implementing tests, check package.json for the testing setup first.

5. **UI Component Standards**: 
   - Use inline styles for consistency (avoid Tailwind CSS mixing)
   - Implement glass morphism with standard pattern: `background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)'`
   - Add smooth CSS animations for interactive components (0.3s transitions)
   - Maintain premium/free tier visual differentiation
   - Follow accordion pattern for expandable content (`expandDown`, `fadeInUp` keyframes)

## Image Processing & Security

### Image Optimization Pipeline
- **Client-side compression**: Target <500KB file size
- **Format conversion**: WebP with JPEG fallback for browser compatibility
- **EXIF stripping**: Remove metadata for privacy protection
- **Multiple sizes**: Generate thumbnail (150x150), medium (600x600), and full (1200x1200) versions
- **Progressive loading**: Optimize for mobile networks

### Security Measures
- **File validation**: Only JPEG, PNG, WebP allowed (max 10MB)
- **Malicious file detection**: Pattern matching for suspicious file extensions
- **Rate limiting**: Implement on all API endpoints (10 req/min per user)
- **Input sanitization**: All user inputs must be validated and sanitized
- **CORS configuration**: Properly configure for API security

### PWA Features
- **Service worker**: Enable offline functionality
- **App manifest**: Configure for installable PWA
- **Background sync**: Handle failed uploads when back online
- **Push notifications**: Engagement and reminder system
- **Offline camera**: Store locally and sync when connection restored

## Performance Standards

### Core Web Vitals Targets
- **LCP**: <2.5s (Largest Contentful Paint)
- **FID**: <100ms (First Input Delay)
- **CLS**: <0.1 (Cumulative Layout Shift)
- **Load time**: <2 seconds on 3G networks

### Optimization Techniques
- **Image lazy loading**: Use Intersection Observer
- **Code splitting**: Separate vendor, Lucide, and Radix UI bundles
- **Caching strategy**: 5-minute cache for Supabase queries
- **CDN usage**: Serve static assets from edge locations

## Related Documentation

- **DEPLOYMENT.md**: Comprehensive production deployment guide including Supabase setup, Stripe configuration, and deployment options
- **COMPONENTS.md**: Full list of 42 installed ShadCN UI components available for use
- **Changelog.md**: Development progress tracking and roadmap (currently 35% complete)
- **.cursorrules**: Additional UI guidelines and conversion psychology patterns