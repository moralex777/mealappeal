# Manual Testing Guide for Ingredient Tracking

## Test Steps

### 1. Test via UI (Recommended)
1. Open http://localhost:3004 in your browser
2. Log in with your test account
3. Go to Camera page
4. Take or upload a photo of food
5. Wait for analysis to complete
6. Check the Supabase dashboard:
   - Go to Table Editor > ingredients
   - Look for new entries (sort by created_at DESC)
   - Check meal_ingredients table for relationships

### 2. Check in Supabase Dashboard

Run this query in SQL Editor to see recent ingredients:
```sql
-- Show ingredients added today
SELECT 
  i.id,
  i.name,
  i.created_at,
  COUNT(mi.meal_id) as used_in_meals
FROM ingredients i
LEFT JOIN meal_ingredients mi ON i.id = mi.ingredient_id
WHERE i.created_at > CURRENT_DATE - INTERVAL '1 day'
GROUP BY i.id, i.name, i.created_at
ORDER BY i.created_at DESC;
```

### 3. Verify Meal-Ingredient Links
```sql
-- Show recent meals with their ingredients
SELECT 
  m.title,
  m.created_at,
  STRING_AGG(i.name, ', ') as ingredients
FROM meals m
LEFT JOIN meal_ingredients mi ON m.id = mi.meal_id
LEFT JOIN ingredients i ON mi.ingredient_id = i.id
WHERE m.created_at > CURRENT_DATE - INTERVAL '1 day'
GROUP BY m.id, m.title, m.created_at
ORDER BY m.created_at DESC
LIMIT 10;
```

### 4. Test Share Reset Date Fix

Run the read-only diagnostic:
```sql
-- Copy contents of test-share-reset-date-readonly.sql
-- Paste and run in Supabase SQL Editor
-- This will show you affected profiles without changing anything
```

## Expected Results

✅ **Successful Test:**
- New ingredients appear in ingredients table
- meal_ingredients table has entries linking meals to ingredients
- Ingredient names are normalized (lowercase, trimmed)
- No duplicate ingredients created

❌ **If Test Fails:**
- Check browser console for errors
- Check Vercel logs if deployed
- Verify the code changes are actually deployed
- Check Supabase logs for database errors

## Quick Verification Commands

```bash
# Check if code is deployed (in production)
curl https://www.mealappeal.app/api/health

# Check recent logs
vercel logs --since 1h

# Check git status
git status
git log --oneline -5
```