# 🚀 MealAppeal Deployment Guide

## Prerequisites

Before deploying MealAppeal, ensure you have:

1. **Supabase Project** with database tables created
2. **OpenAI API Key** with sufficient credits
3. **Stripe Account** with payment products configured
4. **Domain name** for production (recommended)

## 🏗️ Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

**Required Variables:**

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key (starts with sk-)
- `STRIPE_SECRET_KEY` - Stripe secret key (starts with sk\_)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (starts with pk\_)
- `STRIPE_PREMIUM_MONTHLY_PRICE_ID` - Monthly subscription price ID
- `STRIPE_PREMIUM_YEARLY_PRICE_ID` - Yearly subscription price ID
- `STRIPE_WEBHOOK_SECRET` - Webhook endpoint secret (starts with whsec\_)
- `NEXT_PUBLIC_APP_URL` - Your app's URL

### 2. Supabase Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Add missing columns to meals table
ALTER TABLE public.meals
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS scheduled_deletion_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS basic_nutrition JSONB,
ADD COLUMN IF NOT EXISTS premium_nutrition JSONB,
ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS meal_tags TEXT[],
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS calories INTEGER,
ADD COLUMN IF NOT EXISTS protein NUMERIC,
ADD COLUMN IF NOT EXISTS carbs NUMERIC,
ADD COLUMN IF NOT EXISTS fat NUMERIC;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Meals policies
CREATE POLICY "Users can view own meals" ON meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals" ON meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON meals FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meals_user_id_created_at ON public.meals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
```

### 3. Stripe Configuration

1. **Create Products in Stripe Dashboard:**

   - Premium Monthly: $4.99/month
   - Premium Yearly: $49.99/year

2. **Configure Webhook:**

   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`

3. **Copy Price IDs** to environment variables

### 4. Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3004` to test locally.

## 🌐 Production Deployment

### Option A: Vercel (Recommended)

1. **Connect to Vercel:**

   ```bash
   npx vercel --prod
   ```

2. **Add Environment Variables:**

   - Go to Vercel Dashboard > Project Settings > Environment Variables
   - Add all variables from `.env.example`
   - Use production values (live Stripe keys, etc.)

3. **Deploy:**
   ```bash
   npm run build
   vercel --prod
   ```

### Option B: Other Platforms

The app is compatible with:

- **Netlify** - Add environment variables in site settings
- **Railway** - Configure env vars in project settings
- **DigitalOcean App Platform** - Set env vars in app spec

## ✅ Post-Deployment Checklist

### 1. Test Core Functionality

- [ ] User registration/login works
- [ ] Camera capture and AI analysis works
- [ ] Meal storage and retrieval works
- [ ] Payment flow completes successfully
- [ ] Webhook receives Stripe events

### 2. Test Payment Flow

- [ ] Monthly subscription signup works
- [ ] Yearly subscription signup works
- [ ] Subscription cancellation works
- [ ] Premium features are properly gated

### 3. Verify Security

- [ ] Environment variables are not exposed in client
- [ ] API routes require authentication
- [ ] Supabase RLS policies are working
- [ ] HTTPS is enforced

### 4. Performance Check

- [ ] App loads in <3 seconds
- [ ] Images load progressively
- [ ] API responses are <2 seconds
- [ ] Mobile experience is smooth

## 🔧 Configuration Notes

### Stripe Webhook Configuration

Your webhook endpoint should be: `https://yourdomain.com/api/stripe/webhook`

Required events:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`

### OpenAI Usage

The app uses `gpt-4o-mini-2024-07-18` model for food analysis. Monitor usage in OpenAI dashboard to avoid rate limits.

### Database Maintenance

Free tier meals are automatically deleted after 14 days via scheduled function. No manual intervention required.

## 🚨 Troubleshooting

### Common Issues

**Environment Variables Not Loading:**

- Verify all required variables are set
- Check for typos in variable names
- Ensure no trailing spaces in values

**Stripe Webhooks Failing:**

- Verify webhook URL is correct
- Check webhook secret matches environment variable
- Ensure endpoint is publicly accessible

**AI Analysis Not Working:**

- Verify OpenAI API key is valid
- Check API key has sufficient credits
- Monitor OpenAI usage dashboard

**Database Connection Issues:**

- Verify Supabase URL and keys
- Check Supabase project is not paused
- Ensure RLS policies are configured

### Getting Help

1. Check application logs in deployment platform
2. Monitor Supabase logs for database issues
3. Check Stripe dashboard for payment issues
4. Review OpenAI usage for API issues

## 📊 Monitoring

After deployment, monitor:

- **Application Performance** via Vercel Analytics
- **Error Rates** via application logs
- **Payment Success Rate** via Stripe Dashboard
- **API Usage** via OpenAI Dashboard
- **Database Performance** via Supabase Dashboard

## 🔄 Updates

To deploy updates:

```bash
git push origin main  # Triggers automatic deployment on Vercel
```

For manual deployment:

```bash
npm run build
vercel --prod
```

---

## 🎯 Quick Deploy Checklist

**5-Minute Deploy:**

1. [ ] Copy `.env.example` to deployment platform
2. [ ] Fill in all environment variables
3. [ ] Configure Stripe webhook
4. [ ] Deploy to platform
5. [ ] Test payment flow

**Production Ready:**

- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] All tests passing

## 💰 Revenue System Activation

**Immediate Revenue Generation:**

1. [ ] Stripe products created ($4.99/month, $49.99/year)
2. [ ] Webhook configured and tested
3. [ ] Database schema updated with subscription fields
4. [ ] Premium features properly gated
5. [ ] Payment flow tested end-to-end

**Expected Conversion Metrics:**

- Target: 15% free-to-premium conversion
- Free tier: 14-day storage, 3 monthly shares
- Premium tier: Unlimited storage/shares, advanced features

Your MealAppeal app is now ready to generate revenue! 🚀
