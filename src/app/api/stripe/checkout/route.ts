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

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get price ID based on plan type
    const priceId =
      planType === 'yearly'
        ? process.env['STRIPE_PREMIUM_YEARLY_PRICE_ID']
        : process.env['STRIPE_PREMIUM_MONTHLY_PRICE_ID']

    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan type or missing price configuration' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let customerId = profile.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name || 'MealAppeal User',
        metadata: { userId },
      })

      customerId = customer.id

      // Save customer ID to profile
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    // Create checkout session
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
      success_url: `${process.env['NEXT_PUBLIC_APP_URL']}/?payment=success`,
      cancel_url: `${process.env['NEXT_PUBLIC_APP_URL']}/upgrade?payment=cancelled`,
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

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
