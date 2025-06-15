# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MealAppeal Overview

MealAppeal is a smart nutrition analysis SaaS application built with Next.js and Supabase. Users photograph meals to receive instant nutrition insights through OpenAI Vision API integration, with a freemium subscription model targeting health-conscious consumers.

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

# Development Environment Management
npm run setup           # One-command environment setup and validation
npm run dev:reset       # Reset development environment (clean + setup)
npm run clean           # Clean old reports and temporary files
npm run security:scan   # Scan for hardcoded credentials and security issues

# Backend Validation & Monitoring
node scripts/dev/validate-environment.js  # Comprehensive environment validation
curl http://localhost:3000/api/health     # Health check endpoint
curl http://localhost:3000/api/env        # Environment status (dev only)

# Testing & Validation
npm run test:all        # Run comprehensive test suite
npm run db:validate     # Validate database schema
npm run debug:login     # Test user authentication
npm run debug:signup    # Create test users with premium accounts
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
Image Capture → Validation → OpenAI Vision API → USDA Enhancement → Database Storage
```
- **Distributed Rate Limiting**: Redis-based with fallback (Free: 10/hour, Premium: 100-200/hour)
- **Input Validation**: Zod schemas with XSS protection and sanitization
- **Error Handling**: Structured logging, Sentry tracking, graceful degradation
- **Caching**: 5-minute TTL with correlation IDs for debugging
- **Database Operations**: Connection pooling, retry logic, timeouts

**4. Database Schema**
- `profiles`: User data with subscription info, meal counts
- `meals`: Food analysis results with nutrition data and metadata
- `notification_settings`: User notification preferences
- `analytics_events`: User behavior tracking for optimization
- Automatic triggers for meal count updates and data retention

### Production-Ready Infrastructure

**Backend Bulletproofing (COMPLETED)**
- ✅ **Distributed Rate Limiting**: Redis (Upstash) with in-memory fallback
- ✅ **Structured Logging**: Winston + Sentry with correlation IDs
- ✅ **Health Monitoring**: `/api/health` endpoint with dependency checks  
- ✅ **Database Optimization**: Connection pooling, retry logic, timeouts
- ✅ **Security Hardening**: Input validation, CORS, XSS protection
- ✅ **Environment Validation**: Automated configuration checking
- ✅ **Graceful Shutdown**: Connection cleanup and request tracking

**Organized Directory Structure**
```
/
├── scripts/                # Development utilities
│   ├── dev/                # Development helpers (debug, setup)
│   ├── test/               # Test scripts and validation
│   ├── db/                 # Database utilities and migrations
│   ├── deployment/         # Build and deployment scripts
│   └── maintenance/        # Cleanup and maintenance
├── tools/                  # Automation tools
│   ├── setup-environment.js    # Environment validation
│   ├── credential-scanner.js   # Security scanning
│   └── cleanup.js             # Artifact cleanup
├── reports/                # Test results and reports (auto-cleaned)
├── temp/                   # Temporary files (auto-cleaned)
└── docs/development/       # Development documentation
├── src/lib/               # Core backend infrastructure
│   ├── logger.ts          # Structured logging with Winston/Sentry
│   ├── rate-limit.ts      # Distributed rate limiting (Redis)
│   ├── database.ts        # Optimized DB operations with pooling
│   ├── validation.ts      # Input validation and security schemas
│   ├── env-validation.ts  # Environment configuration validation
│   └── graceful-shutdown.ts # Production shutdown handling
```

**Automated Security & Environment Management**
- **Credential Scanner**: Prevents hardcoded credentials from being committed
- **Environment Validator**: Ensures all required env vars are configured
- **Automated Cleanup**: Maintains clean development environment
- **Comprehensive Testing**: Organized test suite with detailed reporting

**Developer Workflow**
1. `npm run setup` - One-command environment setup and validation
2. `npm run security:scan` - Security validation before commits  
3. `npm run test:all` - Comprehensive testing with detailed reporting
4. `npm run clean` - Artifact cleanup and lifecycle management
5. `npm run dev:reset` - Full environment reset (clean + setup)

**Production Readiness Status**
- **Backend Infrastructure**: ✅ 100% complete (enterprise-grade)
- **Security & Validation**: ✅ 100% complete (production-hardened)  
- **Monitoring & Logging**: ✅ 100% complete (structured observability)
- **Database Operations**: ✅ 100% complete (optimized with pooling)
- **Rate Limiting**: ✅ 100% complete (distributed Redis-based)
- **Error Handling**: ✅ 100% complete (graceful degradation)

**Legacy Test Results** 
- **Device Detection**: 95.2% success rate (20/21 tests passed)
- **User Journey**: 100% success rate (18/18 tests passed) 
- **PWA Functionality**: 90.9% success rate (30/33 tests passed)
- **AI Analysis Pipeline**: 95% success rate with proper fallbacks
- **Payment Integration**: Stripe subscription flows fully functional

### Critical Implementation Details

**Authentication Context (`src/contexts/AuthContext.tsx`)**
- **Database Fallback System**: Handles missing database columns gracefully
- If billing_cycle/subscription columns missing, provides safe defaults
- Creates in-memory profiles when database profile doesn't exist
- Essential for new user registration flow stability

**Production API Architecture**
- `/api/analyze-food`: Main analysis endpoint with comprehensive validation
  - ✅ Zod schema validation with XSS protection
  - ✅ Distributed rate limiting with Redis
  - ✅ Structured logging with correlation IDs
  - ✅ Database optimization with retry logic
  - ✅ CORS and security headers
- `/api/health`: System health monitoring endpoint
- `/api/env`: Environment validation endpoint (development)
- `/api/stripe/*`: Payment processing (checkout, webhook, portal)
- All routes implement enterprise-grade error handling and monitoring

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

**CRITICAL: User-Facing Copy Guidelines**
- **NEVER mention "AI" in user-facing text** - focus on user benefits instead
- Replace "AI Coach" → "Personal Coach" or "Nutrition Coach"
- Replace "AI Analysis" → "Smart Analysis" or "Intelligent Analysis"
- Replace "AI Ready" → "Ready" or "Analysis Ready"
- Focus on what the user gets, not the technology behind it
- Use human-centered language that emphasizes personal value

### MealAppeal Design System & UX Rules

**Brand Identity & Visual Language**
- **Brand Colors**: Use gradient combinations from-brand-500 to-orange-500 for primary elements
- **Food Emojis**: Include personality with strategic emoji usage: 🍽️ 📸 📤 ⏳ 🌱 👑
- **Icon Guidelines**: 
  - **NEVER use hospital/medical icons** (Heart, Stethoscope, Cross, Hospital emoji 🏥) - these create clinical associations that conflict with our consumer-friendly brand
  - **Use nature/wellness icons instead**: lotus flowers (🪷), leaves (🌱), sparkles (✨), trophy, star, crown, zap, camera
  - **Approved wellness symbols**: Lotus flowers are specifically approved and should be maintained for health-related features
- **Glass Morphism**: Apply `.glass-effect` class consistently for modern, premium feel
- **Instagram-Worthy Design**: Create shareable, visually appealing interfaces that users want to post
- **Micro-Animations**: Add hover effects and celebration animations for user achievements
- **Card-Based Layouts**: Use consistent card designs with proper spacing and shadows

**Mobile-First Design Principles**
- **One-Thumb Operation**: Design all interactions for single-handed mobile use
- **Touch Targets**: Ensure minimum 44px touch targets for all interactive elements
- **Progressive Enhancement**: Start with mobile experience, enhance for desktop
- **Performance**: Target <2 second load times with efficient image optimization
- **Core Web Vitals**: Maintain compliance for SEO and user experience

**Business Logic Integration**
- **Freemium Feature Gating**: Always implement clear distinction between free and premium features
  - Free tier: 14-day storage retention, 3 monthly shares, basic nutrition analysis
  - Premium tier: unlimited storage/shares, advanced nutrition insights, 6 analysis modes
- **Strategic Upgrade Prompts**: Include conversion psychology with FOMO triggers and social proof
- **Conversion Target**: Design for 15% free-to-premium conversion rate
- **Habit-Forming Features**: Implement streaks, achievements, and daily usage patterns

**User Experience Psychology**
- **3-Second Rule**: Provide instant gratification with immediate feedback on all actions
- **Dopamine Triggers**: Include celebration moments, progress indicators, and achievement notifications
- **Loading States**: Always show progress for async operations with engaging animations
- **Viral Sharing**: Design features that encourage social validation and viral growth
- **Addictive Patterns**: Create daily usage habits through streaks and social features

**Component Development Standards**
- **Accessibility First**: Include ARIA labels, keyboard navigation, and screen reader support
- **React Best Practices**: Use memo, useCallback, useMemo for performance optimization
- **Error Boundaries**: Implement comprehensive error handling with user-friendly messages
- **TypeScript Strict**: Use proper interfaces and type safety throughout
- **Responsive Images**: Implement lazy loading and optimal image formats

## Enterprise Roadmap & Scalability Planning

### MVP Launch Status (COMPLETED)
✅ **Production-Ready Backend Infrastructure**
- Redis-based distributed rate limiting (Upstash integration)
- Structured logging with Sentry error tracking 
- Production environment validation and health checks
- Optimized database connections with pooling and timeouts
- Input validation schemas and CORS security hardening

### Phase 1: Post-Launch Stability (Weeks 1-4)
**Priority: Critical (Required for sustainable growth)**
- [ ] **Background Job Processing**: Move OpenAI calls to queues (Bull/Inngest)
- [ ] **Advanced Caching**: Redis caching for analysis results and USDA data
- [ ] **CDN Integration**: Image optimization and global content delivery
- [ ] **Basic Monitoring Dashboard**: Response times, error rates, user metrics
- [ ] **Automated Alerting**: Critical system failures and performance degradation

### Phase 2: Scale Preparation (Months 2-4)
**Priority: High (Required for 10x user growth)**
- [ ] **Microservices Architecture**: Split monolith into focused services
- [ ] **Multi-Region Deployment**: Geographic distribution with edge computing
- [ ] **Advanced Database Optimization**: Read replicas, connection pooling, query optimization
- [ ] **API Gateway**: Rate limiting, authentication, and request routing
- [ ] **Comprehensive Monitoring**: DataDog/New Relic APM integration

### Phase 3: Enterprise Ready (Months 4-8)
**Priority: Medium (Required for B2B and enterprise sales)**
- [ ] **SOC 2 Type II Compliance**: Security audit and certification
- [ ] **GDPR/CCPA Automation**: Data retention, deletion, and privacy controls
- [ ] **Enterprise Authentication**: SSO, MFA, RBAC, and session management
- [ ] **Advanced Security**: WAF, DDoS protection, penetration testing
- [ ] **Business Continuity**: Disaster recovery with RTO/RPO guarantees

### Phase 4: Acquisition Ready (Months 8-18)
**Priority: Low (Required for $100M+ acquisition)**
- [ ] **Financial Controls**: Cost monitoring, fraud detection, billing reconciliation
- [ ] **Comprehensive Audit Trails**: All user actions, data changes, system events
- [ ] **Multi-Cloud Architecture**: Vendor independence and redundancy
- [ ] **Advanced Analytics**: Business intelligence, predictive analytics, ML pipelines
- [ ] **Regulatory Compliance**: Industry-specific certifications (healthcare, finance)

### Technical Debt & Optimization Targets

**Performance Benchmarks (Phase 1)**
- API response times: <200ms (95th percentile)
- Database query times: <50ms (95th percentile)
- Error rate: <0.1%
- Uptime: 99.9%

**Scalability Targets (Phase 2)**
- Handle 10,000 concurrent users
- Process 1M+ API requests/day
- Support 100TB+ data storage
- Auto-scale based on traffic patterns

**Enterprise Standards (Phase 3-4)**
- 99.99% uptime SLA with multi-region failover
- End-to-end encryption with enterprise key management
- Real-time threat detection and automated response
- Complete audit trails with tamper-proof logging

### Cost Optimization Strategy

**Current MVP Costs** (estimated monthly)
- Supabase: $25-50 (database + auth)
- OpenAI API: $100-500 (depends on usage)
- Vercel: $20-100 (hosting)
- Redis/Upstash: $0-20 (free tier sufficient)
- **Total: $145-670/month**

**Phase 1 Optimization** (2-3x cost increase for 10x capacity)
- Background jobs reduce OpenAI costs by 30%
- Caching reduces database costs by 40%
- CDN reduces bandwidth costs by 60%

**Enterprise Investment Required**
- Phase 1: $10-20K setup + $2-5K/month operational
- Phase 2: $50-100K setup + $10-25K/month operational  
- Phase 3: $200-500K setup + $25-75K/month operational
- Phase 4: $500K-1M setup + $50-150K/month operational

### Security & Compliance Roadmap

**Current Security (MVP)**
✅ Input validation and sanitization
✅ CORS and security headers
✅ Environment variable validation
✅ Basic rate limiting and authentication

**Phase 1 Security Enhancements**
- [ ] Advanced rate limiting with DDoS protection
- [ ] Security scanning and vulnerability management
- [ ] Enhanced logging and anomaly detection

**Enterprise Security (Phase 3-4)**
- [ ] Zero-trust architecture
- [ ] Advanced threat detection
- [ ] Compliance automation (SOX, HIPAA, PCI-DSS)
- [ ] Security operation center (SOC) integration

### Monitoring & Observability Evolution

**Current (MVP)**
✅ Structured logging with Winston
✅ Error tracking with Sentry
✅ Basic health checks
✅ Request correlation IDs

**Production Monitoring (Phase 1)**
- [ ] APM with distributed tracing
- [ ] Custom metrics and dashboards
- [ ] Automated alerting and escalation

**Enterprise Observability (Phase 2-3)**
- [ ] Full-stack observability platform
- [ ] AI-powered anomaly detection
- [ ] Predictive failure analysis
- [ ] Real-time business metrics

## Critical Development Notes

**1. Database Schema Compatibility**
The AuthContext includes robust fallback handling for database schema mismatches:
- Missing columns are handled with default values
- Prevents blocking errors during user registration
- Multiple query fallback layers for production stability

**2. Error Recovery Systems**
- Analysis has multiple fallback layers (OpenAI → mock data → cached responses)
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

**Organized Test Infrastructure**
```
scripts/test/
├── run-all-tests.js         # Comprehensive test runner with reporting
├── test-billing-cycle-fix.js # Database fallback mechanisms
├── test-login.js            # Authentication validation
├── test-functionality.js    # Core system functionality
├── test-ai-analysis.js      # Food analysis pipeline
├── test-stripe-integration.js # Payment processing
├── test-camera-functionality.js # Mobile camera features
├── test-pwa-functionality.js    # PWA features and offline mode
└── test-user-journey-comprehensive.js # End-to-end user flows
```

**Test Categories & Success Rates**
- **Environment**: Database schema and configuration validation
- **Authentication**: User login/registration (validated)
- **Database**: Data operations and queries (validated)
- **AI Analysis**: Food analysis pipeline (95% success rate)
- **Payment**: Stripe integration (fully functional)
- **Mobile**: Camera and PWA functionality (90.9% success rate)
- **Comprehensive**: End-to-end user journeys (100% success rate)

**Development Testing Workflow**
```bash
# Quick validation
npm run setup               # Validate environment setup
npm run security:scan       # Check for security issues
npm run debug:login        # Test authentication

# Comprehensive testing
npm run test:all           # Run full test suite with reporting
npm run db:validate        # Validate database schema

# Maintenance
npm run clean              # Clean old reports and artifacts
npm run dev:reset          # Full environment reset
```

**Manual Testing Checklist**
**PREREQUISITE: Always run `npm run dev` in separate terminal before testing!**
1. **Core User Journey**: `npm run test:all` validates desktop→mobile→analysis flow
2. **Subscription Workflows**: Stripe integration tested with mock payments
3. **Mobile PWA Features**: Camera functionality, offline mode, installation prompts
4. **Error Handling**: Graceful degradation under various failure conditions
5. **Security Validation**: `npm run security:scan` before any commits

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

**1. Environment Setup Issues**
```bash
# Run automated diagnosis
npm run setup

# Check for security problems
npm run security:scan

# Reset everything if needed
npm run dev:reset
```

**2. New User Registration Fails**
- Run `npm run db:validate` to check database schema
- Check AuthContext fallback system for missing database columns
- Verify profile creation trigger in Supabase
- Use `npm run debug:signup` to test user creation

**3. Analysis Errors**
- Verify OpenAI API key with `npm run setup`
- Test analysis pipeline with `npm run test:all`
- Check rate limits and fallback systems
- Review mock data fallbacks in development mode

**4. Subscription Flow Issues**
- Test Stripe integration with `npm run test:all`
- Validate webhook configuration
- Check price IDs match Stripe dashboard
- Use test mode for development validation

**5. Mobile/PWA Problems**
- Run PWA tests: `npm run test:all` includes comprehensive PWA validation
- Test device detection and handoff workflows
- Check service worker registration and manifest configuration
- Verify camera permissions and device detection logic

**6. Development Environment Chaos**
```bash
# Clean up artifacts
npm run clean

# Security scan before commits
npm run security:scan

# Full environment reset
npm run dev:reset
```

**7. Test Failures**
- Check environment: `npm run setup`
- Validate database: `npm run db:validate`
- Review test reports in `reports/` directory
- Use specific debug commands: `npm run debug:login`, `npm run debug:signup`