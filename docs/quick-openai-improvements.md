# Quick OpenAI Improvements - Deploy Today

## 1. Add Seed Parameter (5 min)
```typescript
// In /src/app/api/analyze-food/route.ts
const aiResponse = await openai.chat.completions.create({
  model: "gpt-4o-mini-2024-07-18",
  messages: [...],
  max_tokens: isPremium ? 2000 : 500,
  temperature: 0.3,  // Changed from 0.2
  seed: 42,          // NEW: Consistent results
  response_format: { type: "json_object" }
});
```

## 2. Response Caching (30 min)
```typescript
// Add to existing cache logic
const cacheKey = generateCacheKey(imageDataUrl, focusMode, userTierLevel);

// Extended cache for common foods
const EXTENDED_CACHE_FOODS = ['pizza', 'burger', 'salad', 'pasta'];
const cacheTime = analysis.foodName && 
  EXTENDED_CACHE_FOODS.some(food => 
    analysis.foodName.toLowerCase().includes(food)
  ) ? 30 * 60 * 1000 : CACHE_TTL; // 30 min for common foods
```

## 3. Smart Model Routing (1 hour)
```typescript
// Dynamic model selection
const getOptimalModel = (tier: string, analysisCount: number) => {
  // Use better model for premium after they've done 5+ analyses (engaged users)
  if (tier === 'premium_yearly' || 
      (tier === 'premium_monthly' && analysisCount > 5)) {
    return "gpt-4o"; // If available and <2x price
  }
  return "gpt-4o-mini-2024-07-18";
};

const model = getOptimalModel(userTierLevel, userAnalysisCount);
```

## Deploy Checklist
- [ ] Test locally with seed parameter
- [ ] Verify cache improvements
- [ ] Monitor API costs after deployment
- [ ] A/B test if implementing model routing