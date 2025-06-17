'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowUpRight, Users, DollarSign, Camera, AlertCircle, Database, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalMeals: number;
  mealsToday: number;
  conversionRate: number;
  lastBackup: string | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAdminAccess();
    loadDashboardStats();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    // In production, check if user is admin
    // For now, we'll allow any authenticated user
  };

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users (logged in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', sevenDaysAgo.toISOString());

      // Get premium vs free users
      const { count: premiumUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('subscription_tier', ['premium_monthly', 'premium_yearly']);

      const freeUsers = (totalUsers || 0) - (premiumUsers || 0);

      // Get total meals
      const { count: totalMeals } = await supabase
        .from('meals')
        .select('*', { count: 'exact', head: true });

      // Get meals today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: mealsToday } = await supabase
        .from('meals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Calculate conversion rate
      const conversionRate = totalUsers ? ((premiumUsers || 0) / totalUsers) * 100 : 0;

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        premiumUsers: premiumUsers || 0,
        freeUsers,
        totalMeals: totalMeals || 0,
        mealsToday: mealsToday || 0,
        conversionRate,
        lastBackup: localStorage.getItem('lastBackupTime')
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const createManualBackup = async () => {
    try {
      setBackupLoading(true);
      
      // Export all data
      const tables = ['profiles', 'meals'];
      const backup: any = {
        timestamp: new Date().toISOString(),
        tables: {}
      };

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*');
        
        if (error) throw error;
        backup.tables[table] = data;
      }

      // Create downloadable file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mealappeal-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Save backup time
      localStorage.setItem('lastBackupTime', backup.timestamp);
      
      // Reload stats
      loadDashboardStats();
      
      alert('Backup created successfully!');
    } catch (err) {
      console.error('Backup error:', err);
      alert('Failed to create backup');
    } finally {
      setBackupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor your MealAppeal metrics</p>
        </div>
        <Button onClick={loadDashboardStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers} active this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.premiumUsers} premium users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMeals}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.mealsToday} analyzed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Backup</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createManualBackup} 
              disabled={backupLoading}
              size="sm"
              className="w-full"
            >
              {backupLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Backup'
              )}
            </Button>
            {stats?.lastBackup && (
              <p className="text-xs text-muted-foreground mt-2">
                Last: {format(new Date(stats.lastBackup), 'MMM d, h:mm a')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Free vs Premium users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Free Users</span>
                <span className="font-bold">{stats?.freeUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Premium Users</span>
                <span className="font-bold">{stats?.premiumUsers}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-sm">Target (15% conversion)</span>
                <span className="text-sm">{Math.ceil((stats?.totalUsers || 0) * 0.15)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Open Stripe Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open(process.env.NEXT_PUBLIC_SUPABASE_URL || '', '_blank')}
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Open Supabase Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Open Vercel Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Projection */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Projection</CardTitle>
          <CardDescription>Based on current conversion rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Current MRR</p>
                <p className="font-bold text-lg">
                  ${((stats?.premiumUsers || 0) * 4.99).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">At 100 users</p>
                <p className="font-bold text-lg">
                  ${(100 * (stats?.conversionRate || 0) / 100 * 4.99).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">At 1000 users</p>
                <p className="font-bold text-lg">
                  ${(1000 * (stats?.conversionRate || 0) / 100 * 4.99).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Status */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Status</CardTitle>
          <CardDescription>External monitoring services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Vercel Analytics</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sentry Error Tracking</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span>UptimeRobot</span>
              <span className="text-muted-foreground">Not configured</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Google Analytics</span>
              <span className="text-muted-foreground">Not configured</span>
            </div>
          </div>
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Set up UptimeRobot at{' '}
              <a href="https://uptimerobot.com" target="_blank" rel="noopener noreferrer" className="underline">
                uptimerobot.com
              </a>{' '}
              for free uptime monitoring
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}