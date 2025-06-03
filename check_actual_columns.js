const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://dxuabbcppncshcparsqd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzY5MDAsImV4cCI6MjA2NDExMjkwMH0.RXSD68SZI6GlLRwtbmgbRYYJ-90_x7Xm75xC_8i5yac'
)

async function checkActualColumns() {
  console.log('🔍 DISCOVERING ACTUAL DATABASE SCHEMA')
  console.log('=====================================')

  try {
    // First authenticate
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'alex@propertytalents.com',
      password: 'Alex.1234',
    })

    if (loginError) {
      console.log('❌ Login failed:', loginError.message)
      return
    }

    console.log('✅ Authenticated as:', loginData.user.email)

    // Get one meal to see the actual structure
    const { data: meals, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', loginData.user.id)
      .limit(1)

    if (error) {
      console.log('❌ Error:', error.message)
      return
    }

    if (meals && meals[0]) {
      const meal = meals[0]
      console.log('\n✅ ACTUAL COLUMNS IN MEALS TABLE:')
      console.log('=================================')

      Object.keys(meal).forEach((column, i) => {
        const value = meal[column]
        const type = Array.isArray(value) ? 'array' : typeof value
        const displayValue = value === null ? 'NULL' : JSON.stringify(value)
        console.log(
          `${i + 1}. ${column}: ${type} = ${displayValue.substring(0, 80)}${displayValue.length > 80 ? '...' : ''}`
        )
      })

      console.log('\n📋 COLUMN NAMES ONLY:')
      console.log(Object.keys(meal).join(', '))

      console.log('\n🔍 SAMPLE MEAL VALUES:')
      console.log('ID:', meal.id)
      console.log('Created:', meal.created_at)
      console.log('User ID:', meal.user_id)
    } else {
      console.log('📭 No meals found for this user')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkActualColumns()
