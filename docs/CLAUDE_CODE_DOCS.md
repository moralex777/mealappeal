# Claude Code Documentation Reference for MealAppeal

This document provides essential documentation references for MealAppeal development. These resources support the immediate next phases: OpenAI Vision API integration, Stripe subscription activation, and production deployment.

## TIER 1: CRITICAL DOCUMENTATION

### 1. Supabase Documentation
**URL**: https://supabase.com/docs  
**Priority**: HIGHEST  
**Focus Areas**:
- **Database**: Full PostgreSQL with real-time functionality, backups, and extensions
- **Authentication**: Email/password, passwordless, OAuth, and mobile logins
- **Storage**: Store and serve large files with Row Level Security (RLS)
- **Real-time**: Listen to database changes and broadcast data to clients
- **Edge Functions**: Low-latency server-side code execution

**Key Features for MealAppeal**:
- RLS policies for user data isolation
- Storage buckets for meal images with 14-day retention
- Real-time subscriptions for instant updates
- Auth providers for seamless user onboarding

### 2. Stripe API Documentation
**URL**: https://docs.stripe.com  
**Priority**: HIGHEST  
**Focus Areas**:
- Subscription billing for freemium model ($4.99/month, $49.99/year)
- Webhook handling for payment events
- Customer portal for self-service management
- Payment method management
- Pricing tables and checkout flows

**Implementation Notes**:
- Webhook security with signature verification
- Customer portal for subscription management
- Automated billing with retry logic
- Usage-based pricing support

### 3. Next.js 14 App Router Documentation
**URL**: https://nextjs.org/docs  
**Priority**: HIGHEST  
**Focus Areas**:
- **Server Components**: Default rendering on server for performance
- **Client Components**: Interactive elements with "use client" directive
- **API Routes**: Custom endpoints with route handlers
- **Middleware**: Request preprocessing and authentication
- **Image Optimization**: Built-in next/image component

**App Router Patterns**:
- Server-side data fetching with caching
- Dynamic routes for flexible content
- Streaming and loading UI
- Error boundaries for graceful failure handling

### 4. Tailwind CSS v4 Documentation
**URL**: https://tailwindcss.com/docs  
**Priority**: HIGH  
**Focus Areas**:
- Zero-runtime utility-first CSS
- Mobile-first responsive design
- Dark mode capabilities
- Custom theme configuration
- Glass morphism effects with backdrop filters

**MealAppeal Styling**:
- Custom MealAppeal brand colors
- Responsive breakpoints for mobile
- Glass morphism components
- Animation utilities

### 5. PWA Documentation (MDN)
**URL**: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps  
**Priority**: HIGH  
**Focus Areas**:
- **Service Workers**: Enable offline functionality and caching
- **App Manifest**: Control installation and appearance
- **Camera API**: getUserMedia() for food photography
- **Background Sync**: Handle network tasks when offline
- **Push Notifications**: User engagement features

**Camera-First Implementation**:
- getUserMedia() for camera access
- Image capture and processing
- Offline queue for meal uploads
- Native app-like experience

## TIER 2: HIGH VALUE DOCUMENTATION

### 6. OpenAI API Documentation
**URL**: https://platform.openai.com/docs  
**Priority**: HIGH  
**Focus Areas**:
- Vision API for food image analysis
- GPT-4o-mini-2024-07-18 model specifics
- JSON response formatting
- Rate limiting and quotas
- Structured outputs for nutrition data

**Integration Notes**:
- Replace current mocked functionality
- Implement retry logic for API calls
- Cache responses for cost optimization
- Handle rate limits gracefully

### 7. TypeScript Documentation
**URL**: https://www.typescriptlang.org/docs  
**Priority**: MEDIUM  
**Focus Areas**:
- Interface definitions for type safety
- Error handling patterns
- Generic types for reusable components
- Utility types for data transformation
- Strict mode best practices

**Code Quality**:
- Type-safe API responses
- Component prop validation
- Error boundary types
- Database query types

### 8. React Email Documentation
**URL**: https://react.email/docs  
**Priority**: MEDIUM  
**Focus Areas**:
- React component-based email templates
- Tailwind CSS integration for styling
- Testing across email clients
- Resend integration setup
- Responsive email designs

**Email Templates**:
- Welcome emails
- Subscription confirmations
- Payment receipts
- Weekly meal summaries

### 9. Vercel Deployment Documentation
**URL**: https://vercel.com/docs  
**Priority**: MEDIUM  
**Focus Areas**:
- Zero-configuration Next.js deployment
- Environment variable management
- Custom domain setup (MealAppeal.app)
- Performance analytics
- Preview deployments

**Production Setup**:
- Automatic deployments from Git
- SSL certificates management
- Edge network distribution
- Core Web Vitals monitoring

## TIER 3: SUPPORTING DOCUMENTATION

### 10. ShadCN/UI Documentation
**URL**: https://ui.shadcn.com/docs  
**Priority**: LOW  
**Focus Areas**:
- Component customization patterns
- CSS variable theming
- Accessibility standards
- Form components with validation
- Mobile-optimized designs

**Component Library**:
- 42 components already installed
- Full code ownership
- Customizable to MealAppeal brand
- React Hook Form integration

## Development Workflow Integration

### Immediate Next Steps:
1. **OpenAI Vision API**: Replace mocked analysis with real API calls
2. **Stripe Activation**: Enable subscription billing and webhooks
3. **Production Deploy**: Configure custom domain and environment
4. **PWA Enhancement**: Implement offline queue and camera optimization
5. **Performance Tuning**: Optimize Core Web Vitals and bundle size

### Quick Reference Commands:
```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Code quality checks

# Database
npx supabase db push # Update database schema
npx supabase gen types # Generate TypeScript types

# Deployment
vercel               # Deploy to Vercel
vercel --prod        # Deploy to production
```

### Environment Variables Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`

This documentation setup provides comprehensive reference material to support MealAppeal's continued development while maintaining the existing foundation and architecture.