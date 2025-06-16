## 🎯 Purpose
<!-- Brief description of what this PR does -->

## 🏗️ Type of Change
<!-- Check the relevant box -->
- [ ] 🐛 `fix:` Bug fix (resolves issue #___)
- [ ] ✨ `feat:` New feature
- [ ] 🚀 `perf:` Performance improvement
- [ ] 📝 `docs:` Documentation update
- [ ] 🎨 `style:` UI/styling changes
- [ ] ♻️ `refactor:` Code refactoring
- [ ] 🧪 `test:` Test additions/updates
- [ ] 🔧 `chore:` Maintenance tasks
- [ ] 🚨 `hotfix:` Critical production fix

## 📋 Pre-Deployment Checklist
<!-- Ensure all checks pass before marking PR ready -->

### Development Testing
- [ ] Tested in `npm run dev`
- [ ] Ran `npm run validate` (lint, format, typecheck)
- [ ] Ran `npm run security:scan` (no exposed credentials)

### Production Build Testing
- [ ] Tested with `npm run build && npm run start`
- [ ] Feature visible in production build
- [ ] No console errors in production build
- [ ] All functionality works as expected

### Code Quality
- [ ] No hardcoded localhost URLs
- [ ] Added feature flags if needed
- [ ] Implemented loading states
- [ ] Added error boundaries
- [ ] Tested on mobile viewport

### Vercel Preview
- [ ] Tested on Vercel preview URL
- [ ] Connected to production services successfully
- [ ] No errors in Vercel function logs

## 🔍 Testing Performed
<!-- Describe the testing you've done -->
- [ ] Happy path scenarios
- [ ] Error scenarios
- [ ] Missing environment variables handled
- [ ] Slow network conditions tested

## 📸 Screenshots/Videos
<!-- Add screenshots or videos of the feature in action -->
<!-- Show both development and preview deployment if UI changes -->

## 🚀 Deployment Notes
<!-- Any special instructions for deployment -->
- **New environment variables**: <!-- List any new env vars -->
- **Database changes**: <!-- Note any schema changes -->
- **Breaking changes**: <!-- Note any breaking changes -->
- **Feature flags**: <!-- List feature flags to enable -->

## 📝 Additional Context
<!-- Any additional information that reviewers should know -->