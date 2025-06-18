# MealAppeal Quick Reference Guide

## 🚀 Essential Documentation Links

### Core Technologies
| Technology | Documentation | Primary Use |
|------------|--------------|-------------|
| **Supabase** | [docs.supabase.com](https://supabase.com/docs) | Database, Auth, Storage, Real-time |
| **Stripe** | [docs.stripe.com](https://docs.stripe.com) | Payments, Subscriptions, Webhooks |
| **Next.js 14** | [nextjs.org/docs](https://nextjs.org/docs) | App Router, API Routes, SSR/SSG |
| **Tailwind CSS v4** | [tailwindcss.com/docs](https://tailwindcss.com/docs) | Styling, Responsive Design |
| **PWA/MDN** | [MDN PWA Docs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) | Offline, Camera, Mobile |

### AI & Development Tools
| Technology | Documentation | Primary Use |
|------------|--------------|-------------|
| **OpenAI** | [platform.openai.com/docs](https://platform.openai.com/docs) | Vision API, GPT-4o-mini |
| **TypeScript** | [typescriptlang.org/docs](https://www.typescriptlang.org/docs) | Type Safety, Interfaces |
| **React Email** | [react.email/docs](https://react.email/docs) | Email Templates, Resend |
| **Vercel** | [vercel.com/docs](https://vercel.com/docs) | Deployment, Domains, Analytics |
| **ShadCN/UI** | [ui.shadcn.com/docs](https://ui.shadcn.com/docs) | Component Library |

## 📋 Common Tasks Quick Reference

### Development Workflow
```bash
# Start development
npm run setup        # First time setup
npm run dev          # Start dev server (keep running!)

# Before committing
npm run security:scan    # Check for secrets
npm run validate         # Lint, format, typecheck
npm run test:all        # Run all tests

# Deployment
npm run build           # Test production build
vercel --prod          # Deploy to production
```

### Database Operations
```bash
# Supabase CLI
npx supabase db push        # Push schema changes
npx supabase gen types      # Generate TypeScript types
npx supabase db reset       # Reset database (dev only!)

# Testing
npm run db:validate         # Validate schema
npm run db:test            # Test connectivity
```

### Stripe Integration
```bash
# Stripe CLI (for webhooks)
stripe login
stripe listen --forward-to localhost:3004/api/stripe/webhook
stripe trigger payment_intent.succeeded

# Test cards
4242424242424242    # Success
4000000000000002    # Decline
```

### AI Testing
```bash
# Environment check
npm run debug:env       # Verify OPENAI_API_KEY

# Test analysis
npm run api:food       # Test food analysis endpoint
```

## 🔑 Key Patterns

### API Route Pattern
```typescript
// Every API route follows this structure:
export async function POST(request: Request) {
  const correlationId = crypto.randomUUID();
  
  try {
    // 1. Validate input
    const body = await request.json();
    const validated = schema.parse(body);
    
    // 2. Check rate limits
    const rateLimited = await checkRateLimit(userId);
    if (!rateLimited.allowed) return new Response('Rate limited', { status: 429 });
    
    // 3. Process request
    const result = await processRequest(validated);
    
    // 4. Return response
    return NextResponse.json(result);
    
  } catch (error) {
    logger.error('API error', { error, correlationId });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Database Query Pattern
```typescript
// All DB operations use retry logic:
const result = await executeWithRetry(
  async () => {
    return await supabase
      .from('table')
      .select('*')
      .eq('user_id', userId)
      .single();
  },
  { retries: 3 }
);
```

### Component Pattern
```typescript
// Client components for interactivity
'use client';

// Server components by default
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent initialData={data} />;
}
```

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Can't login" | Check profiles table exists, run `npm run db:validate` |
| "Analysis fails" | Verify OpenAI key with `npm run debug:env` |
| "Build errors" | Run `npm run typecheck` to find issues |
| "Deployment fails" | Check Vercel env vars match local |
| "Stripe webhooks" | Use `stripe listen` in development |

## 📊 Performance Targets

- **Page Load**: <2s (Lighthouse 95+)
- **API Response**: <200ms p95
- **Image Upload**: <3s on 4G
- **Offline Mode**: Full functionality
- **Bundle Size**: <500KB initial

## 🔐 Security Checklist

- [ ] Run `npm run security:scan` before commits
- [ ] Never commit `.env.local`
- [ ] Use Zod schemas for all inputs
- [ ] Sanitize user content
- [ ] Check CORS headers
- [ ] Validate file uploads

## 📱 Mobile Testing

```bash
# Local network testing
npm run dev -- --hostname 0.0.0.0

# Access from phone
http://[your-local-ip]:3004

# Chrome DevTools
1. Toggle device toolbar (Ctrl+Shift+M)
2. Test on iPhone 12 Pro, Samsung Galaxy S21
3. Check offline mode
4. Test camera permissions
```

## 🎯 Next Steps Priority

1. **Activate Stripe Payments** (See Stripe docs)
2. **Enable OpenAI Vision** (Replace mocks)
3. **Deploy to Production** (Vercel + domain)
4. **Monitor Performance** (Vercel Analytics)
5. **Scale Infrastructure** (See scaling benefits doc)