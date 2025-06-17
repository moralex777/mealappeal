# MealAppeal - Smart Food Analysis

MealAppeal is a smart nutrition analysis SaaS application built with Next.js and Supabase. Users photograph meals to receive instant nutrition insights through OpenAI Vision API integration, with a freemium subscription model targeting health-conscious consumers.

## Quick Start

### 1. Environment Setup
```bash
# Clone and install
git clone <repository>
cd mealappeal
npm install

# One-command environment setup
npm run setup
```

### 2. Configure Environment
Edit `.env.local` with your actual values (created from `.env.example`):
- Supabase credentials
- OpenAI API key  
- Stripe payment keys

### 3. Start Development
```bash
# Start development server
npm run dev

# Run security validation
npm run security:scan

# Test core functionality
npm run test:all
```

## Development Workflow

### 🚀 Branch & Commit Strategy (Conventional Commits)

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear history and automated versioning.

**Branch Naming**:
```bash
feat/meal-sharing          # New feature
fix/camera-permissions     # Bug fix
hotfix/payment-critical    # Urgent production fix
chore/update-deps         # Maintenance
```

**Commit Format**:
```bash
feat: add meal sharing functionality
fix: resolve iOS camera permission issue
hotfix: fix payment processing error
```

### Development Process

1. **Start New Work**:
```bash
git checkout main && git pull
git checkout -b feat/your-feature
```

2. **Development Testing**:
```bash
npm run dev              # Start dev server
npm run validate         # Before committing
npm run security:scan    # Check for exposed secrets
```

3. **Production Build Testing** (CRITICAL):
```bash
npm run build && npm run start  # Test production build locally
```

4. **Deploy**:
```bash
git push origin feat/your-feature  # Creates Vercel preview
# Test on preview URL before merging!
```

## Development Commands

### Environment Management
- `npm run setup` - One-command environment setup and validation
- `npm run dev:reset` - Reset development environment (clean + setup)
- `npm run security:scan` - Scan for hardcoded credentials and security issues

### Development & Build
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Testing & Validation
- `npm run test:all` - Run comprehensive test suite with reporting
- `npm run db:validate` - Validate database schema
- `npm run debug:login` - Test user authentication
- `npm run debug:signup` - Create test users

### Admin & Monitoring
- `/admin` - Admin dashboard (restricted access)
- Manual backup creation
- User statistics and conversion tracking
- Quick links to Stripe, Supabase, and Vercel dashboards
- Admin management: `npm run admin:list`, `npm run admin:add email@example.com`

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking
- `npm run validate` - Run all quality checks

### Maintenance
- `npm run clean` - Clean old reports and temporary files
- `npm run clean:preview` - Preview what would be cleaned

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.3.2 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Analysis**: OpenAI Vision API (gpt-4o-mini-2024-07-18)
- **Payments**: Stripe subscriptions
- **PWA**: Service workers, offline functionality, mobile-first design

### Directory Structure
```
/
├── src/                    # Application source code
│   ├── app/               # Next.js app router pages
│   ├── components/        # React components
│   ├── contexts/          # React contexts (auth, etc.)
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utilities and configurations
├── scripts/               # Development utilities
│   ├── dev/              # Development helpers
│   ├── test/             # Test scripts
│   ├── db/               # Database utilities
│   └── maintenance/      # Cleanup scripts
├── tools/                # Automation tools
├── docs/development/     # Development documentation
└── supabase/            # Database migrations
```

## Key Features

### 🍽️ Smart Food Analysis
- Photo-based meal analysis using OpenAI Vision API
- Comprehensive nutrition data with USDA integration
- Multiple analysis modes (health, fitness, cultural, etc.)
- Rate limiting and caching for performance

### 📱 Mobile-First PWA
- Desktop-to-mobile QR code handoff workflow
- Native app-like experience with offline functionality
- Camera integration for food photography
- Push notifications and background sync

### 💳 Freemium Business Model
- Free tier: 3 meals/day, basic nutrition
- Premium: Unlimited analysis, advanced features
- Stripe subscription management
- Automated billing and webhook handling

### 🔒 Security & Performance
- Supabase Row Level Security (RLS) policies
- Environment variable validation
- Automated credential scanning
- Response caching and fallback systems

## Test Results

Recent comprehensive test results:
- **Device Detection**: 95.2% success rate (20/21 tests passed)
- **User Journey**: 100% success rate (18/18 tests passed) 
- **PWA Functionality**: 90.9% success rate (30/33 tests passed)
- **AI Analysis Pipeline**: 95% success rate with proper fallbacks
- **Payment Integration**: Stripe subscription flows fully functional

## Development Workflow

### Before Committing
```bash
npm run security:scan     # Check for security issues
npm run validate         # Run code quality checks  
npm run test:all        # Run comprehensive tests
npm run clean           # Clean artifacts
```

### Troubleshooting
```bash
npm run setup           # Diagnose environment issues
npm run dev:reset       # Reset development environment
npm run db:validate     # Check database schema
```

## Environment Variables

Required variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Optional enhancements:
- `USDA_API_KEY` - Enhanced nutrition data
- `DEBUG_EMAIL` / `DEBUG_PASSWORD` - Development testing

## Contributing

1. Run `npm run setup` to validate your environment
2. Use `npm run security:scan` before commits
3. Follow the organized directory structure
4. Test with `npm run test:all` before submitting PRs

## Production Monitoring (Simple Approach)

MealAppeal uses a pragmatic monitoring approach suitable for early-stage SaaS:

### Current Monitoring Stack
- **Admin Dashboard** - `/admin` page with key metrics and manual backup
- **Vercel Analytics** - Built-in performance monitoring
- **Sentry** - Error tracking (already configured)
- **Stripe Dashboard** - Revenue and subscription monitoring

### Recommended Setup
1. Set up [UptimeRobot](https://uptimerobot.com) (free) for uptime monitoring
2. Enable Google Analytics for user behavior tracking
3. Check `/admin` dashboard weekly for metrics
4. Review Stripe Dashboard for revenue trends

### Future Infrastructure
Advanced MCP servers are archived in `/future-features/` for when you reach 100+ paying users.

## Documentation

- [Development Workflow Guide](docs/development/workflow.md)
- [CLAUDE.md](CLAUDE.md) - Comprehensive development guide
- [MCP Implementation Guide](docs/MCP_IMPLEMENTATION.md) - Production infrastructure
- [Claude Code Docs Reference](docs/CLAUDE_CODE_DOCS.md) - Essential external documentation
- [Environment Setup](.env.example) - Configuration template

## Support

For development issues:
1. Run `npm run setup` to validate environment
2. Check comprehensive documentation in `CLAUDE.md`
3. Review test results with `npm run test:all`