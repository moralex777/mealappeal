import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isAdminEmail } from '@/lib/admin-config';

// Create service role client for admin operations
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get total users using service role key (bypasses RLS)
    const { count: totalUsers } = await supabaseService
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users (logged in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: activeUsers } = await supabaseService
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_sign_in_at', sevenDaysAgo.toISOString());

    // Get premium vs free users
    const { count: premiumUsers } = await supabaseService
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('subscription_tier', ['premium_monthly', 'premium_yearly']);

    const freeUsers = (totalUsers || 0) - (premiumUsers || 0);

    // Get total meals
    const { count: totalMeals } = await supabaseService
      .from('meals')
      .select('*', { count: 'exact', head: true });

    // Get meals today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: mealsToday } = await supabaseService
      .from('meals')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Calculate conversion rate
    const conversionRate = totalUsers ? ((premiumUsers || 0) / totalUsers) * 100 : 0;

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      premiumUsers: premiumUsers || 0,
      freeUsers,
      totalMeals: totalMeals || 0,
      mealsToday: mealsToday || 0,
      conversionRate,
      lastBackup: null // Will be handled client-side
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}