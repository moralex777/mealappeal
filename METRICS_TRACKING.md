# 📊 MealAppeal Metrics Tracking

**Purpose**: Track key business and technical metrics to drive data-informed decisions for scaling MealAppeal globally.

---

## 💰 Revenue Metrics

### Primary KPIs
| Metric | Current | Target | Tracking Method |
|--------|---------|---------|-----------------|
| **MRR (Monthly Recurring Revenue)** | $0 | $665 | Stripe Dashboard |
| **Total Users** | ~50 | 1,000 | Supabase Analytics |
| **Paying Users** | 0 | 150 | Stripe Customers |
| **Conversion Rate** | 0% | 15% | Custom Analytics |
| **ARPU (Avg Revenue Per User)** | $0 | $4.43 | Calculated |
| **Churn Rate** | N/A | <5% | Stripe + Analytics |
| **LTV (Lifetime Value)** | N/A | $89 | Calculated |

### Conversion Funnel
```
Visitor → Sign Up → First Meal → Hit Limit → See Upgrade → Purchase
  100%  →   25%   →    80%    →    100%   →     50%    →   30%
```

### Pricing Metrics
- **Monthly Plan**: $4.99/month
- **Yearly Plan**: $49.99/year (2 months free)
- **Yearly Preference**: Target 60% yearly subscriptions
- **Price Sensitivity**: Test points at $3.99, $4.99, $5.99

---

## 📈 User Engagement Metrics

### Activity Metrics
| Metric | Current | Target | Notes |
|--------|---------|---------|--------|
| **DAU (Daily Active Users)** | ~10 | 300 | 30% of total |
| **WAU (Weekly Active Users)** | ~20 | 700 | 70% of total |
| **MAU (Monthly Active Users)** | ~40 | 900 | 90% of total |
| **Meals/User/Day** | 1.2 | 2.5 | Core engagement |
| **Session Duration** | 2.5 min | 4 min | Time in app |
| **Sessions/Day** | 1.8 | 3.0 | App opens |

### Retention Cohorts
```
Day 1:  100% (baseline)
Day 7:   60% (target)
Day 14:  45% (target)
Day 30:  35% (target)
Day 90:  25% (target)
```

### Feature Adoption
- **Camera Usage**: Target 80% of meals via camera
- **USDA Data Views**: Target 60% of premium users
- **Meal History Access**: Target 70% weekly
- **Profile Completion**: Target 85%

---

## ⚡ Technical Performance Metrics

### API Performance
| Endpoint | Current | Target | P95 Latency |
|----------|---------|---------|-------------|
| **/analyze-food** | 2.1s | <1.5s | 3.2s |
| **/api/health** | 45ms | <50ms | 120ms |
| **/meals GET** | 230ms | <200ms | 450ms |
| **/auth** | 180ms | <150ms | 350ms |

### Infrastructure Metrics
```
Server Response Time: <200ms (target)
Time to First Byte: <600ms (target)
Page Load Time: <2s (target)
Lighthouse Score: >90 (target)
```

### Error Rates
- **Overall Error Rate**: <1% (target)
- **Payment Failures**: <3% (target)
- **Image Upload Failures**: <2% (target)
- **API Timeout Rate**: <0.5% (target)

---

## 💸 Cost Optimization Metrics

### Per-User Costs (Monthly)
| Service | Current | Target | Notes |
|---------|---------|---------|--------|
| **OpenAI API** | $0.12 | $0.08 | Via caching |
| **Supabase Storage** | $0.05 | $0.04 | Compression |
| **Hosting (Vercel)** | $0.02 | $0.02 | Stable |
| **Email (Resend)** | $0.01 | $0.01 | Stable |
| **Total Cost/User** | $0.20 | $0.15 | 25% reduction |

### Margin Analysis
```
Free User: -$0.20/month (cost)
Premium Monthly: $4.79/month profit (96% margin)
Premium Yearly: $3.99/month profit (96% margin)
Blended (15% premium): $0.52/month profit per user
```

---

## 📱 Platform & Device Metrics

### Device Distribution
- **Mobile**: 75% (target)
  - iOS: 45%
  - Android: 30%
- **Desktop**: 20%
- **Tablet**: 5%

### Browser Distribution
- Safari Mobile: 40%
- Chrome Mobile: 30%
- Chrome Desktop: 15%
- Other: 15%

### PWA Metrics
- **Install Rate**: 25% of regular users (target)
- **PWA vs Web Usage**: 60/40 split (target)
- **Offline Usage**: 15% of sessions

---

## 🚀 Growth Metrics

### Acquisition Channels
| Channel | Current | Target | CAC |
|---------|---------|---------|-----|
| **Organic Search** | 20% | 40% | $0 |
| **Social Media** | 30% | 25% | $2 |
| **Referral** | 10% | 20% | $1 |
| **Direct** | 40% | 15% | $0 |

### Viral Metrics
- **K-Factor**: 0.3 (target: 0.5)
- **Viral Cycle Time**: 7 days
- **Share Rate**: 10% of users (target: 30%)
- **Share → Signup**: 5% (target: 10%)

---

## 📊 Tracking Implementation

### Current Tools
- ✅ Supabase Analytics (basic)
- ✅ Vercel Analytics (web vitals)
- ⚠️ Sentry (errors only)
- ❌ Customer Analytics (needed)

### Recommended Stack
1. **Mixpanel/PostHog**: User behavior
2. **Stripe Analytics**: Revenue tracking
3. **Custom Dashboard**: Key metrics
4. **Datadog/New Relic**: Infrastructure

### Key Events to Track
```javascript
// Revenue Events
track('subscription_started', { plan, price, method })
track('subscription_cancelled', { reason, tenure })
track('upgrade_prompted', { location, tier })

// Engagement Events  
track('meal_analyzed', { method, premium, time_taken })
track('feature_used', { feature, tier })
track('app_opened', { source, session_length })

// Conversion Events
track('limit_reached', { tier, meals_count })
track('upgrade_clicked', { location, current_tier })
track('payment_completed', { plan, amount })
```

---

## 🎯 Weekly Review Checklist

### Every Monday
- [ ] Review previous week's metrics
- [ ] Calculate conversion rate
- [ ] Check cost per user
- [ ] Review error rates
- [ ] Update this document

### Key Questions
1. Is conversion trending toward 15%?
2. Are costs per user decreasing?
3. Is engagement improving?
4. What's blocking growth?
5. Where are users dropping off?

---

## 📈 Success Milestones

### 30 Days
- [ ] 100 total users
- [ ] 10 paying customers
- [ ] 10% conversion rate
- [ ] $50 MRR

### 60 Days
- [ ] 500 total users
- [ ] 60 paying customers
- [ ] 12% conversion rate
- [ ] $250 MRR

### 90 Days
- [ ] 1,000 total users
- [ ] 150 paying customers
- [ ] 15% conversion rate
- [ ] $665 MRR

---

## 🔔 Alerts & Thresholds

Set up monitoring for:
- Error rate > 2%
- API latency > 3s
- Conversion rate < 8%
- Churn rate > 7%
- Daily signups < 5
- Infrastructure cost > $200/month