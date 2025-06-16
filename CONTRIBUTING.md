# Contributing to MealAppeal

Thank you for contributing to MealAppeal! This guide will help you get started.

## 🚀 Quick Start

1. **Setup Environment**
   ```bash
   npm install
   npm run setup  # Validates environment
   ```

2. **Start Development**
   ```bash
   npm run dev    # Keep running in separate terminal
   ```

3. **Before Committing**
   ```bash
   npm run validate       # Lint, format, typecheck
   npm run security:scan  # Check for secrets
   ```

## 📝 Git Workflow

### Branch Naming
```bash
feat/feature-name      # New features
fix/bug-description    # Bug fixes
hotfix/critical-issue  # Urgent fixes
chore/task-name       # Maintenance
```

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```bash
feat: add export functionality
fix: resolve camera permission issue
chore: update dependencies
```

## 🧪 Testing Requirements

### 1. Development Testing
```bash
npm run dev
# ✅ Test your feature at localhost:3004
```

### 2. Production Build Testing (REQUIRED!)
```bash
npm run build && npm run start
# ✅ Feature must work in production build
```

### 3. Run Tests
```bash
npm run test:all  # Run all tests
```

## 📋 Pull Request Process

1. Create feature branch from `main`
2. Make your changes
3. Test thoroughly (dev + production build)
4. Push to GitHub
5. Create PR using the template
6. Wait for review

### PR Checklist
- [ ] Tested in development
- [ ] Tested production build locally
- [ ] No hardcoded URLs or secrets
- [ ] Added tests if applicable
- [ ] Updated documentation

## 🚨 Important Guidelines

### Always Test Production Build
Many issues only appear in production builds:
```bash
NODE_ENV=production npm run build
npm run start
```

### Use Feature Flags
For new features, add flags:
```bash
echo "NEXT_PUBLIC_FEATURE_NAME=true" >> .env.local
```

### Handle Missing Services
```javascript
if (!process.env.STRIPE_KEY) {
  // Gracefully degrade
  return <FreeVersionOnly />;
}
```

### Never Commit Secrets
Run before every commit:
```bash
npm run security:scan
```

## 📁 Project Structure

```
src/
├── app/          # Next.js pages
├── components/   # React components
├── lib/          # Utilities
└── contexts/     # React contexts

scripts/
├── test/         # Test scripts
└── dev/          # Dev utilities
```

## 🐛 Reporting Issues

1. Check existing issues first
2. Use issue templates
3. Include:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable

## 💡 Suggesting Features

1. Check roadmap in CLAUDE.md
2. Open discussion first
3. Wait for approval before implementing

## 🙏 Thank You!

Your contributions make MealAppeal better for everyone!