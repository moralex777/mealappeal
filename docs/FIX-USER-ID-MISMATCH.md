# Fix: User ID Mismatch in Authentication Flow

## Problem Description

A critical authentication issue was discovered where the `profiles` table has two user ID fields:
- `id` (UUID) - Primary key, references auth.users(id)
- `user_id` (UUID) - Additional field storing the same value

The database trigger only populated the `id` field, but the application queries looked for `user_id`, causing profile lookups to fail and authentication issues.

## Root Cause

1. **Database Schema**: The profiles table was designed with both `id` and `user_id` fields
2. **Trigger Mismatch**: The profile creation trigger only set `id`, not `user_id`
3. **Query Pattern**: Application code queries profiles using `eq('user_id', session.user.id)`
4. **Result**: Profile lookups failed even when profiles existed

## Solution Implemented

### 1. Updated Profile Creation Trigger
Modified `create-profile-trigger.sql` to set both fields:
```sql
INSERT INTO public.profiles (
  id,
  user_id,  -- Now setting both fields
  ...
) VALUES (
  NEW.id,
  NEW.id,   -- Same value for compatibility
  ...
)
```

### 2. Updated AuthContext
Modified profile creation in `src/contexts/AuthContext.tsx`:
```typescript
supabase.from('profiles').insert([{
  id: session.user.id,      // Set id field
  user_id: session.user.id,  // Set user_id for compatibility
  ...
}])
```

### 3. Created Migration Script
`fix-profile-user-id-mismatch.sql` to fix existing profiles:
```sql
UPDATE public.profiles 
SET user_id = id 
WHERE user_id IS NULL OR user_id != id;
```

### 4. Created Diagnostic Tool
`scripts/db/check-user-id-mismatch.js` to detect and diagnose mismatches:
```bash
npm run db:check-user-id
```

## Verification

Run the diagnostic script to verify all profiles are correctly configured:
```bash
npm run db:check-user-id
```

Expected output:
```
✅ Correct (id = user_id): X profiles
❌ NULL user_id: 0 profiles
⚠️  Mismatched IDs: 0 profiles
```

## Production Deployment

1. **Apply the migration** in production:
   ```bash
   psql $DATABASE_URL -f fix-profile-user-id-mismatch.sql
   ```

2. **Verify the fix**:
   ```bash
   npm run db:check-user-id
   ```

3. **Monitor authentication**:
   - Check that new users can sign up successfully
   - Verify existing users can log in
   - Confirm profile data loads correctly

## Long-term Solution

Eventually, we should:
1. Standardize on using only the `id` field
2. Update all queries to use `id` instead of `user_id`
3. Remove the redundant `user_id` field in a future migration

## Impact

This fix resolves:
- ❌ "No profile exists" errors during authentication
- ❌ Profile creation failures
- ❌ Inconsistent authentication behavior
- ❌ Users unable to access their meal data

## Prevention

To prevent similar issues:
1. Always test database triggers with actual application queries
2. Ensure consistency between schema design and application code
3. Use diagnostic tools to verify data integrity
4. Test authentication flow end-to-end after schema changes