# Account Page Debug Guide

## Browser DevTools Investigation Steps

### 1. Open Browser DevTools
- **Chrome/Edge**: Right-click → Inspect OR F12
- **Firefox**: Right-click → Inspect Element OR F12
- **Safari**: Develop → Show Web Inspector (enable in Preferences first)

### 2. Console Tab Investigation

After navigating to `/account`, look for these specific console logs:

#### Expected Success Flow:
```
🔑 Auth initializing (ONCE)
✅ Session found after 1 attempts - restoring user state: user@example.com
🔄 Getting profile...
✅ Profile set
🔍 Account: Starting loadProfile, user: [USER_ID], retry: 0
📊 Account: Querying profiles with user_id: [USER_ID]
✅ Account: Profile found: {data}
🏁 Account: Setting loading to false
```

#### Common Error Patterns:

**Pattern 1: Infinite Loading**
```
🔍 Account: Starting loadProfile, user: [USER_ID], retry: 0
📊 Account: Querying profiles with user_id: [USER_ID]
(No further logs - page stuck in loading state)
```

**Pattern 2: Profile Not Found**
```
🔍 Account: Starting loadProfile, user: [USER_ID], retry: 0
📊 Account: Querying profiles with user_id: [USER_ID]
📊 Account: First query result: {data: null, error: null}
🔄 Account: Trying fallback query with id: [USER_ID]
📊 Account: Fallback query result: {data: null, error: null}
❌ Account: No profile data found
🏁 Account: Setting loading to false
```

**Pattern 3: Database Column Error**
```
❌ Profile query error: column profiles.billing_cycle does not exist
🔄 Retrying with basic profile query...
```

**Pattern 4: JavaScript Error**
```
Uncaught TypeError: Cannot read properties of null (reading 'subscription_tier')
    at AccountPage (page.tsx:356)
```

### 3. Network Tab Investigation

1. **Clear Network Log** (🚫 icon)
2. **Navigate to /account**
3. **Look for these requests:**

#### Supabase Auth Requests:
- `GET /auth/v1/session` - Should return 200
- `GET /auth/v1/user` - Should return 200

#### Profile Requests:
- `GET /rest/v1/profiles?select=*&user_id=eq.[USER_ID]` - Check status
  - ✅ 200 = Success
  - ❌ 400 = Bad request (check column names)
  - ❌ 404 = Not found
  - ❌ 500 = Server error

#### Common Network Issues:
- **CORS errors**: Check if origin is allowed
- **401 Unauthorized**: Session expired
- **Rate limiting**: 429 status code

### 4. Application Tab Investigation

1. **Go to Application Tab**
2. **Check Local Storage** → `[your-domain]`
3. **Look for:**
   - `sb-[project-ref]-auth-token` - Should contain session
   - `mealappeal_streak` - Streak data (if any)

4. **Check Session Storage** → Similar auth tokens

### 5. Quick Fixes to Try

#### Fix 1: Clear All Storage
```javascript
// Run in Console:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

#### Fix 2: Force Profile Refresh
```javascript
// Run in Console after page loads:
const { supabase } = await import('/src/lib/supabase')
const session = await supabase.auth.getSession()
console.log('Current session:', session)

if (session.data.session) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.data.session.user.id)
    .single()
  
  console.log('Profile query result:', { data, error })
}
```

#### Fix 3: Check Auth State
```javascript
// Run in Console:
const authState = JSON.parse(localStorage.getItem('sb-[project-ref]-auth-token'))
console.log('Auth state:', authState)
console.log('User ID:', authState?.user?.id)
console.log('Email:', authState?.user?.email)
```

### 6. Mobile-Specific Debugging

If on mobile or using mobile emulation:

1. **Check User Agent Detection:**
```javascript
// Run in Console:
console.log('Is Mobile?', /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
```

2. **Monitor Retry Logic:**
- Mobile has 300ms initial delay
- Up to 3 retries with 500ms between
- Watch for "📱 Mobile: No data found, retrying..." logs

### 7. Running the Debug Script

From your terminal:
```bash
# First, check which user you're testing with
node scripts/test/debug-account-page.js your-email@example.com

# This will:
# - Check if user exists in auth
# - Check if profile exists
# - Identify missing columns
# - Suggest fixes
```

### 8. Common Solutions

#### Solution A: Profile Doesn't Exist
The AuthContext will try to create a default profile in memory, but you can force creation:

```sql
-- Run in Supabase SQL Editor
INSERT INTO profiles (id, user_id, email, full_name, subscription_tier, meal_count)
VALUES (
  'YOUR_USER_ID',
  'YOUR_USER_ID', 
  'your-email@example.com',
  'Your Name',
  'free',
  0
);
```

#### Solution B: Missing Columns
If you see column errors, the app has fallback queries that should work. If not, you may need to add the columns:

```sql
-- Add missing columns (if needed)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
```

#### Solution C: Cache Issues
1. Clear browser cache completely
2. Try incognito/private mode
3. Try a different browser
4. On mobile: Close all tabs, clear app data

### 9. Report Back

Please provide:
1. **Exact error messages** from Console (red text)
2. **Failed network requests** (status code and response)
3. **Console log sequence** (which logs appear and in what order)
4. **Browser and device** (e.g., "Chrome on iPhone 12")
5. **Any infinite loops** (same log repeating)

This information will help identify the exact issue and provide a targeted fix.