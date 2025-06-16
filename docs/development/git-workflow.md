# Git Workflow & Development Process

This guide outlines the MealAppeal development workflow to ensure features work correctly in production.

## 🎯 The Problem We're Solving

"It works on my machine" but not in production because:
- Environment variables differ between local and production
- Build optimizations change behavior
- Caching layers hide issues
- Production services behave differently

## 🚀 Branch Naming Convention

We use **Conventional Commits** style branch names:

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

## 📝 Commit Message Format

```bash
# Type: description (keep it under 50 chars)
feat: add meal sharing functionality
fix: resolve iOS camera permission issue
hotfix: fix critical payment processing error

# With scope
feat(auth): add biometric login
fix(camera): improve low-light capture

# With breaking change
feat(api): new authentication required

BREAKING CHANGE: all API calls now require auth token
```

## 🔄 Development Process

### Step 1: Create Feature Branch

```bash
# Always start from updated main
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feat/export-pdf

# Add feature flag if it's a new feature
echo "NEXT_PUBLIC_FEATURE_EXPORT=true" >> .env.local
```

### Step 2: Development Testing

```bash
# Start dev server (keep running in separate terminal)
npm run dev

# Your feature should work at http://localhost:3000

# Before committing, ALWAYS run:
npm run validate        # Lint, format, typecheck
npm run security:scan   # Check for exposed credentials
```

### Step 3: Production Build Testing (CRITICAL!)

This is where most "works locally" issues are caught:

```bash
# Build with production optimizations
NODE_ENV=production npm run build

# Run the production build
npm run start

# Now test at http://localhost:3000
# Ask yourself:
# ✅ Is my feature still visible?
# ✅ Does it still work correctly?
# ✅ Any console errors?
# ✅ Check mobile view too
```

### Step 4: Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with conventional format
git commit -m "feat: add PDF export for meal history"

# For longer descriptions:
git commit -m "feat: add PDF export for meal history" -m "
- Add export button to history page
- Generate PDF with nutrition data
- Include meal photos in export
- Add progress indicator
"
```

### Step 5: Push for Preview Deployment

```bash
# Push to create Vercel preview
git push origin feat/export-pdf

# Vercel will comment on your PR with preview URL
# Example: https://mealappeal-feat-export-pdf-abc123.vercel.app
```

### Step 6: Test on Preview URL

**CRITICAL**: Test your feature on the preview URL with production data:
- Uses production environment variables
- Connects to real services
- Has production optimizations

### Step 7: Create Pull Request

Use the PR template and ensure all checks pass:
- [ ] Tested locally in dev
- [ ] Tested production build
- [ ] Tested on preview URL
- [ ] No hardcoded values
- [ ] Added feature flags if needed

### Step 8: Merge & Deploy

Once approved and merged:
```bash
# Vercel auto-deploys to production
# Takes 2-3 minutes

# Verify deployment
curl https://www.mealappeal.app/api/health

# Test your feature on production
# Monitor Vercel dashboard for errors
```

## 🛡️ Common Pitfalls & Solutions

### 1. Feature Works in Dev but Not in Production Build

**Problem**: Using development-only conditions
```javascript
// BAD - feature disappears in production
{process.env.NODE_ENV === 'development' && <Feature />}

// GOOD - use feature flags
{process.env.NEXT_PUBLIC_FEATURE_EXPORT === 'true' && <Feature />}
```

### 2. Missing Environment Variables

**Problem**: Forgetting to add variables to Vercel
```javascript
// This might be undefined in production
const key = process.env.STRIPE_SECRET_KEY;

// Always check and handle gracefully
if (!key) {
  logger.error('Stripe key missing');
  return <FreeVersionOnly />;
}
```

### 3. Hardcoded Localhost URLs

**Problem**: Using localhost in code
```javascript
// BAD
fetch('http://localhost:3000/api/data')

// GOOD
fetch('/api/data')
```

### 4. CSS Classes Missing in Production

**Problem**: Tailwind purges unused classes
```jsx
// BAD - dynamic classes might be purged
<div className={`text-${color}-500`} />

// GOOD - use complete class names
<div className={color === 'red' ? 'text-red-500' : 'text-blue-500'} />
```

## 🚨 Emergency Procedures

### Quick Rollback

If something breaks in production:

```bash
# Option 1: Git revert
git revert HEAD
git push origin main

# Option 2: Vercel Dashboard
# Go to Vercel → Project → Deployments
# Click "..." on previous deployment → "Promote to Production"
```

### Hotfix Process

For critical production bugs:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/payment-error

# Make minimal fix
# Test thoroughly
# Push immediately
git push origin hotfix/payment-error

# Create PR marked as HOTFIX
# Merge directly to main after approval
```

## 📋 Pre-Deployment Checklist

Before ANY deployment:

- [ ] Feature works in `npm run dev`
- [ ] Feature works in `npm run build && npm run start`  
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Loading states added
- [ ] Error states handled
- [ ] Feature flags configured
- [ ] Environment variables documented
- [ ] Tested on Vercel preview URL

## 🎯 Quick Command Reference

```bash
# Start new feature
git checkout -b feat/feature-name

# Test before committing
npm run validate && npm run security:scan

# Test production build
npm run build && npm run start

# Commit with conventional format
git commit -m "feat: add feature description"

# Push for preview
git push origin feat/feature-name

# After merge, verify production
curl https://www.mealappeal.app/api/health
```

Remember: **Always test the production build locally before deploying!**