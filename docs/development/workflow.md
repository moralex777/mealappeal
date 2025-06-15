# Development Workflow Guide

## Overview

This guide covers the organized development workflow for MealAppeal, designed to prevent development environment chaos and maintain security.

## Quick Start

```bash
# 1. One-command environment setup
npm run setup

# 2. Start development
npm run dev

# 3. Run security scan (recommended before commits)
npm run security:scan

# 4. Run comprehensive tests
npm run test:all

# 5. Clean up development artifacts
npm run clean
```

## Directory Structure

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
├── docs/development/       # Development documentation
└── .dev/                   # Development configuration
```

## Development Commands

### Environment Management
- `npm run setup` - One-command environment setup and validation
- `npm run dev:reset` - Reset development environment (clean + setup)
- `npm run security:scan` - Scan for hardcoded credentials and security issues

### Testing & Validation
- `npm run test:all` - Run comprehensive test suite
- `npm run db:validate` - Validate database schema
- `npm run validate` - Run code quality checks (lint, format, typecheck)

### Cleanup & Maintenance
- `npm run clean` - Clean old reports and temporary files
- `npm run clean:preview` - Preview what would be cleaned (dry run)

### Debug & Development
- `npm run debug:login` - Test user authentication
- `npm run debug:signup` - Create test users with premium accounts

## File Organization Rules

### ✅ DO
- Put test scripts in `scripts/test/`
- Put development utilities in `scripts/dev/`
- Put database scripts in `scripts/db/`
- Use environment variables for all credentials
- Run `npm run security:scan` before commits
- Use `npm run setup` when onboarding new developers

### ❌ DON'T
- Put test files in project root
- Hardcode credentials in any file
- Commit temporary files or reports
- Create `*debug*.js` or `*test*.js` files outside scripts/
- Skip environment variable validation

## Security Guidelines

### Environment Variables
Always use environment variables for sensitive data:

```javascript
// ❌ NEVER DO THIS
const supabase = createClient(
  'https://hardcoded-url.supabase.co',
  'hardcoded-key'
);

// ✅ ALWAYS DO THIS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Security Validation
The automated security scanner checks for:
- Hardcoded Supabase URLs and keys
- JWT tokens in code
- API keys and secrets
- Common credential patterns

## Testing Workflow

### Test Categories
1. **Environment** - Database schema and configuration
2. **Authentication** - User login and registration
3. **Database** - Data operations and queries
4. **AI Analysis** - Food analysis pipeline
5. **Payment** - Stripe integration and subscriptions
6. **Mobile** - Camera and PWA functionality
7. **Comprehensive** - End-to-end user journeys

### Running Tests
```bash
# Run all tests with reporting
npm run test:all

# Run specific test
node scripts/test/test-login.js

# Validate database schema
npm run db:validate
```

## Git Workflow

### Before Committing
1. Run security scan: `npm run security:scan`
2. Run code validation: `npm run validate`
3. Clean artifacts: `npm run clean`
4. Test core functionality: `npm run test:all`

### Commit Messages
Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `refactor:` Code refactoring
- `test:` Test updates
- `chore:` Maintenance tasks

## Troubleshooting

### Environment Issues
```bash
# Reset everything
npm run dev:reset

# Check environment
npm run setup

# Validate configuration
cat .env.local
```

### Test Failures
```bash
# Check security issues
npm run security:scan

# Validate database
npm run db:validate

# Clean and retry
npm run clean && npm run test:all
```

### Development Artifacts
```bash
# Preview cleanup
npm run clean:preview

# Clean everything
npm run clean

# Reset development environment
npm run dev:reset
```

## File Lifecycle Management

### Automatic Cleanup
- Test reports: 7 days
- Temporary files: 1 day
- Log files: 3 days
- Empty directories: Immediate

### Manual Cleanup
```bash
# Preview what will be cleaned
npm run clean:preview

# Clean all artifacts
npm run clean
```

## New Developer Onboarding

1. **Clone repository**
   ```bash
   git clone <repository>
   cd mealappeal
   ```

2. **Environment setup**
   ```bash
   npm install
   npm run setup
   ```

3. **Configure environment**
   - Edit `.env.local` with actual values
   - Follow setup instructions in the file

4. **Validate setup**
   ```bash
   npm run security:scan
   npm run validate
   npm run test:all
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

## Maintenance

### Daily
- `npm run clean` - Clean old artifacts

### Weekly
- `npm run security:scan` - Security audit
- `npm run test:all` - Comprehensive testing

### Monthly
- Review and update dependencies
- Rotate API keys and credentials
- Update documentation

## Support

For issues with the development workflow:
1. Check this documentation
2. Run `npm run setup` to validate environment
3. Check `CLAUDE.md` for additional context
4. Review recent commits for similar solutions