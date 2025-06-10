-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_meal_reminders BOOLEAN DEFAULT true NOT NULL,
  email_weekly_summary BOOLEAN DEFAULT true NOT NULL,
  email_premium_features BOOLEAN DEFAULT false NOT NULL,
  push_meal_analysis_complete BOOLEAN DEFAULT true NOT NULL,
  push_sharing_activity BOOLEAN DEFAULT true NOT NULL,
  push_achievement_unlocked BOOLEAN DEFAULT true NOT NULL,
  push_premium_tips BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_settings
CREATE POLICY "Users can view their own notification settings" ON public.notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" ON public.notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" ON public.notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification settings" ON public.notification_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION public.update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_settings_updated_at();

-- Create default notification settings for existing users
INSERT INTO public.notification_settings (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.notification_settings);