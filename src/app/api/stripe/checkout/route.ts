import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
  apiVersion: '2025-05-28.basil',
})

const supabase = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!
)

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId, planType = 'monthly' } = await request.json()

    console.log('🚀 Checkout API called:', { userId, planType })

    if (!userId) {
      console.error('❌ No userId provided')
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get price ID based on plan type
    const priceId =
      planType === 'yearly'
        ? process.env['NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID']
        : process.env['NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID']

    console.log('💰 Price ID for', planType, ':', priceId)

    // Check if we have Stripe configured
    const stripeKey = process.env['STRIPE_SECRET_KEY']
    const isDevelopment = process.env['NODE_ENV'] === 'development'
    
    // If no Stripe key or dummy key, provide mock checkout URL for development
    if (!stripeKey || stripeKey.includes('dummy')) {
      console.log('🚧 Stripe not configured, using mock checkout URL for development')
      
      if (isDevelopment) {
        // Return a mock success URL for development testing
        const mockUrl = `${process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3004'}/upgrade/success?mock=true&plan=${planType}&userId=${userId}`
        
        return NextResponse.json({
          sessionId: `mock_session_${Date.now()}`,
          url: mockUrl,
          mock: true,
          message: 'Development mode - using mock checkout'
        })
      } else {
        return NextResponse.json(
          { error: 'Payment system not configured. Please contact support.' },
          { status: 503 }
        )
      }
    }

    if (!priceId || priceId.includes('dummy')) {
      console.error('❌ Missing or invalid price ID for plan:', planType)
      return NextResponse.json(
        { 
          error: 'Stripe products not configured', 
          details: isDevelopment ? 'Run: npm run setup:stripe' : undefined 
        },
        { status: 400 }
      )
    }

    // Get user from Supabase Auth first
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser?.user) {
      console.error('❌ Auth user not found:', authError)
      return NextResponse.json({ error: 'User authentication failed' }, { status: 401 })
    }

    console.log('✅ Auth user found:', authUser.user.email)

    // Get user profile - if it doesn't exist, create it
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', userId)
      .single()

    console.log('👤 Profile lookup result:', { profile, profileError })

    if (profileError?.code === 'PGRST116' || !profile) {
      // Create profile if it doesn't exist
      console.log('🔧 Creating missing profile for user:', userId)
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          user_id: userId,
          email: authUser.user.email,
          full_name: authUser.user.user_metadata?.['full_name'] || authUser.user.email?.split('@')[0] || 'User',
          subscription_tier: 'free',
          meal_count: 0,
          monthly_shares_used: 0,
        })
        .select('stripe_customer_id, email, full_name')
        .single()

      if (createError) {
        console.error('❌ Failed to create profile:', createError)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }

      profile = newProfile
      console.log('✅ Created new profile:', profile)
    }

    if (!profile) {
      console.error('❌ Profile still not found after creation attempt')
      return NextResponse.json({ error: 'User profile not available' }, { status: 404 })
    }

    let customerId = profile.stripe_customer_id

    // Use auth user email as fallback
    const customerEmail = profile.email || authUser.user.email
    const customerName = profile.full_name || authUser.user.user_metadata?.['full_name'] || 'MealAppeal User'

    console.log('📧 Customer details:', { email: customerEmail, name: customerName })

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      console.log('🔧 Creating new Stripe customer...')
      
      if (!customerEmail) {
        console.error('❌ No email available for Stripe customer')
        return NextResponse.json({ error: 'User email required for subscription' }, { status: 400 })
      }

      const customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: { userId },
      })

      customerId = customer.id
      console.log('✅ Created Stripe customer:', customerId)

      // Save customer ID to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)

      if (updateError) {
        console.error('⚠️ Failed to save customer ID to profile:', updateError)
        // Continue anyway - customer was created in Stripe
      }
    } else {
      console.log('✅ Using existing Stripe customer:', customerId)
    }

    // Create checkout session
    console.log('🛒 Creating Stripe checkout session...', {
      customerId,
      priceId,
      planType,
      userId,
      customerIdType: typeof customerId,
      customerIdLength: customerId?.length
    })

    // Ensure customerId is a string
    if (typeof customerId !== 'string') {
      console.error('❌ Customer ID is not a string:', customerId)
      return NextResponse.json({ error: 'Invalid customer ID format' }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env['NODE_ENV'] === 'development' ? 'http://localhost:3004' : process.env['NEXT_PUBLIC_APP_URL']}/upgrade/success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
      cancel_url: `${process.env['NODE_ENV'] === 'development' ? 'http://localhost:3004' : process.env['NEXT_PUBLIC_APP_URL']}/upgrade?payment=cancelled`,
      metadata: {
        userId,
        planType,
      },
      subscription_data: {
        metadata: {
          userId,
          planType,
        },
      },
    })

    console.log('✅ Checkout session created:', session.id, 'URL:', session.url)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('💥 Stripe checkout error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    })
    
    // More specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session'
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env['NODE_ENV'] === 'development' ? error : undefined
    }, { status: 500 })
  }
}
