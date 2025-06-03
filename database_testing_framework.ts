// 🧪 MEALAPPEAL DATABASE TESTING FRAMEWORK
// Comprehensive TypeScript testing utilities for debugging database issues

import { createClient } from '@supabase/supabase-js'

import type { Database } from './src/lib/database.types'

// Initialize test client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const testClient = createClient<Database>(supabaseUrl, supabaseServiceKey)

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  data?: any
  error?: any
}

class MealAppealDatabaseTester {
  private results: TestResult[] = []

  // 🔍 Test 1: Verify Database Schema
  async testDatabaseSchema(): Promise<TestResult[]> {
    console.log('🔍 Testing Database Schema...')

    try {
      // Test meals table structure
      const { data: mealsColumns, error: mealsError } = await testClient
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'meals')
        .eq('table_schema', 'public')

      if (mealsError) {
        this.results.push({
          test: 'Meals Table Schema',
          status: 'FAIL',
          message: 'Could not fetch meals table schema',
          error: mealsError,
        })
      } else {
        const requiredColumns = [
          'id',
          'created_at',
          'user_id',
          'image_url',
          'analysis',
          'focus',
          'shared',
          'deleted_at',
        ]

        const missingColumns = requiredColumns.filter(
          col => !mealsColumns?.some(dbCol => dbCol.column_name === col)
        )

        if (missingColumns.length > 0) {
          this.results.push({
            test: 'Meals Table Schema',
            status: 'FAIL',
            message: `Missing required columns: ${missingColumns.join(', ')}`,
            data: { missingColumns, availableColumns: mealsColumns },
          })
        } else {
          this.results.push({
            test: 'Meals Table Schema',
            status: 'PASS',
            message: 'All required columns present',
            data: mealsColumns,
          })
        }
      }

      // Test profiles table structure
      const { data: profilesColumns, error: profilesError } = await testClient
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'profiles')
        .eq('table_schema', 'public')

      if (profilesError) {
        this.results.push({
          test: 'Profiles Table Schema',
          status: 'FAIL',
          message: 'Could not fetch profiles table schema',
          error: profilesError,
        })
      } else {
        this.results.push({
          test: 'Profiles Table Schema',
          status: 'PASS',
          message: 'Profiles table accessible',
          data: profilesColumns,
        })
      }
    } catch (error) {
      this.results.push({
        test: 'Database Connection',
        status: 'FAIL',
        message: 'Failed to connect to database',
        error,
      })
    }

    return this.results
  }

  // 🧪 Test 2: Test Meal Insertion (Analyze-Food API)
  async testMealInsertion(testUserId: string): Promise<TestResult> {
    console.log('🧪 Testing Meal Insertion...')

    try {
      const testMealData = {
        user_id: testUserId,
        image_url: 'data:image/jpeg;base64,test-image-data',
        analysis: {
          foodName: 'Test Healthy Bowl',
          focus: 'Health & Wellness',
          shareableQuote: 'Amazing superfood bowl!',
          confidence: 0.95,
          nutrition: {
            calories: 350,
            protein: 15,
            carbs: 45,
            fat: 12,
          },
          focus_insights: [
            'Incredible protein source',
            'Perfect energy balance',
            'Nutrient-dense superfoods',
          ],
          funFacts: ['Contains complete amino acids', 'Boosts metabolism naturally'],
          health_score: 9,
          meal_tags: ['healthy', 'bowl', 'nutritious'],
        },
        focus: 'health_wellness',
        shared: false,
        deleted_at: null,
      }

      const { data: meal, error: insertError } = await testClient
        .from('meals')
        .insert(testMealData)
        .select()
        .single()

      if (insertError) {
        return {
          test: 'Meal Insertion',
          status: 'FAIL',
          message: `Insert failed: ${insertError.message}`,
          error: insertError,
          data: testMealData,
        }
      }

      // Clean up test data
      await testClient.from('meals').delete().eq('id', meal.id)

      return {
        test: 'Meal Insertion',
        status: 'PASS',
        message: 'Meal inserted and cleaned up successfully',
        data: meal,
      }
    } catch (error) {
      return {
        test: 'Meal Insertion',
        status: 'FAIL',
        message: 'Unexpected error during meal insertion',
        error,
      }
    }
  }

  // 📊 Test 3: Test Meals Retrieval (Meals Page)
  async testMealsRetrieval(testUserId: string): Promise<TestResult> {
    console.log('📊 Testing Meals Retrieval...')

    try {
      const { data: meals, error: fetchError } = await testClient
        .from('meals')
        .select(
          `
          id,
          user_id,
          created_at,
          image_url,
          analysis,
          focus,
          shared,
          deleted_at
        `
        )
        .eq('user_id', testUserId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10)

      if (fetchError) {
        return {
          test: 'Meals Retrieval',
          status: 'FAIL',
          message: `Query failed: ${fetchError.message}`,
          error: fetchError,
        }
      }

      // Test data parsing
      const parsedMeals = meals?.map(meal => ({
        id: meal.id,
        created_at: meal.created_at,
        image_url: meal.image_url,
        analysis: meal.analysis
          ? {
              name: (meal.analysis as any)?.foodName || 'Delicious Meal',
              calories: (meal.analysis as any)?.nutrition?.calories || 0,
              protein: (meal.analysis as any)?.nutrition?.protein || 0,
              carbs: (meal.analysis as any)?.nutrition?.carbs || 0,
              fat: (meal.analysis as any)?.nutrition?.fat || 0,
            }
          : null,
      }))

      return {
        test: 'Meals Retrieval',
        status: 'PASS',
        message: `Successfully retrieved ${meals?.length || 0} meals`,
        data: { rawMeals: meals, parsedMeals },
      }
    } catch (error) {
      return {
        test: 'Meals Retrieval',
        status: 'FAIL',
        message: 'Unexpected error during meals retrieval',
        error,
      }
    }
  }

  // 🔐 Test 4: Test RLS Policies
  async testRLSPolicies(): Promise<TestResult[]> {
    console.log('🔐 Testing RLS Policies...')

    const results: TestResult[] = []

    try {
      // Test meals table policies
      const { data: mealsPolicies, error: mealsError } = await testClient
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'meals')
        .eq('schemaname', 'public')

      if (mealsError) {
        results.push({
          test: 'Meals RLS Policies',
          status: 'FAIL',
          message: `Could not fetch RLS policies: ${mealsError.message}`,
          error: mealsError,
        })
      } else {
        results.push({
          test: 'Meals RLS Policies',
          status: mealsPolicies && mealsPolicies.length > 0 ? 'PASS' : 'WARNING',
          message: `Found ${mealsPolicies?.length || 0} RLS policies for meals table`,
          data: mealsPolicies,
        })
      }

      // Test profiles table policies
      const { data: profilesPolicies, error: profilesError } = await testClient
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'profiles')
        .eq('schemaname', 'public')

      if (profilesError) {
        results.push({
          test: 'Profiles RLS Policies',
          status: 'FAIL',
          message: `Could not fetch RLS policies: ${profilesError.message}`,
          error: profilesError,
        })
      } else {
        results.push({
          test: 'Profiles RLS Policies',
          status: profilesPolicies && profilesPolicies.length > 0 ? 'PASS' : 'WARNING',
          message: `Found ${profilesPolicies?.length || 0} RLS policies for profiles table`,
          data: profilesPolicies,
        })
      }
    } catch (error) {
      results.push({
        test: 'RLS Policies Check',
        status: 'FAIL',
        message: 'Failed to check RLS policies',
        error,
      })
    }

    return results
  }

  // 📈 Test 5: Test Performance
  async testPerformance(testUserId: string): Promise<TestResult[]> {
    console.log('📈 Testing Performance...')

    const results: TestResult[] = []

    try {
      // Test meals query performance
      const startTime = performance.now()

      const { data: meals, error } = await testClient
        .from('meals')
        .select('*')
        .eq('user_id', testUserId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20)

      const endTime = performance.now()
      const queryTime = endTime - startTime

      if (error) {
        results.push({
          test: 'Meals Query Performance',
          status: 'FAIL',
          message: `Query failed: ${error.message}`,
          error,
        })
      } else {
        results.push({
          test: 'Meals Query Performance',
          status: queryTime < 1000 ? 'PASS' : 'WARNING',
          message: `Query took ${queryTime.toFixed(2)}ms for ${meals?.length || 0} meals`,
          data: { queryTime, mealCount: meals?.length || 0 },
        })
      }

      // Test database size
      const { data: sizeData, error: sizeError } = await testClient.rpc('pg_database_size', {
        database_name: 'postgres',
      })

      if (!sizeError && sizeData) {
        results.push({
          test: 'Database Size',
          status: 'PASS',
          message: `Database size: ${(sizeData / 1024 / 1024).toFixed(2)} MB`,
          data: { sizeBytes: sizeData, sizeMB: sizeData / 1024 / 1024 },
        })
      }
    } catch (error) {
      results.push({
        test: 'Performance Check',
        status: 'FAIL',
        message: 'Performance test failed',
        error,
      })
    }

    return results
  }

  // 🎯 Test 6: End-to-End Workflow Test
  async testEndToEndWorkflow(testUserId: string): Promise<TestResult[]> {
    console.log('🎯 Testing End-to-End Workflow...')

    const results: TestResult[] = []
    let createdMealId: string | null = null

    try {
      // Step 1: Create a meal (simulate analyze-food API)
      const mealData = {
        user_id: testUserId,
        image_url: 'data:image/jpeg;base64,test-workflow-image',
        analysis: {
          foodName: 'E2E Test Meal',
          nutrition: { calories: 400, protein: 20, carbs: 30, fat: 15 },
        },
        focus: 'health_wellness',
        shared: false,
      }

      const { data: createdMeal, error: createError } = await testClient
        .from('meals')
        .insert(mealData)
        .select()
        .single()

      if (createError) {
        results.push({
          test: 'E2E: Meal Creation',
          status: 'FAIL',
          message: `Failed to create meal: ${createError.message}`,
          error: createError,
        })
        return results
      }

      createdMealId = createdMeal.id
      results.push({
        test: 'E2E: Meal Creation',
        status: 'PASS',
        message: 'Meal created successfully',
        data: createdMeal,
      })

      // Step 2: Retrieve the meal (simulate meals page)
      const { data: retrievedMeals, error: retrieveError } = await testClient
        .from('meals')
        .select('*')
        .eq('id', createdMealId)
        .single()

      if (retrieveError) {
        results.push({
          test: 'E2E: Meal Retrieval',
          status: 'FAIL',
          message: `Failed to retrieve meal: ${retrieveError.message}`,
          error: retrieveError,
        })
      } else {
        results.push({
          test: 'E2E: Meal Retrieval',
          status: 'PASS',
          message: 'Meal retrieved successfully',
          data: retrievedMeals,
        })
      }

      // Step 3: Update profile meal count
      const { error: profileUpdateError } = await testClient
        .from('profiles')
        .update({
          meal_count: testClient.sql`meal_count + 1`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testUserId)

      if (profileUpdateError) {
        results.push({
          test: 'E2E: Profile Update',
          status: 'WARNING',
          message: `Profile update issue: ${profileUpdateError.message}`,
          error: profileUpdateError,
        })
      } else {
        results.push({
          test: 'E2E: Profile Update',
          status: 'PASS',
          message: 'Profile meal count updated',
        })
      }
    } catch (error) {
      results.push({
        test: 'E2E: Workflow',
        status: 'FAIL',
        message: 'End-to-end workflow failed',
        error,
      })
    } finally {
      // Cleanup: Delete test meal
      if (createdMealId) {
        await testClient.from('meals').delete().eq('id', createdMealId)

        results.push({
          test: 'E2E: Cleanup',
          status: 'PASS',
          message: 'Test data cleaned up',
        })
      }
    }

    return results
  }

  // 📊 Generate Test Report
  generateReport(): void {
    console.log('\n🔍 MEALAPPEAL DATABASE TEST REPORT')
    console.log('=====================================')

    const passCount = this.results.filter(r => r.status === 'PASS').length
    const failCount = this.results.filter(r => r.status === 'FAIL').length
    const warnCount = this.results.filter(r => r.status === 'WARNING').length

    console.log(`\n📊 SUMMARY:`)
    console.log(`✅ PASS: ${passCount}`)
    console.log(`❌ FAIL: ${failCount}`)
    console.log(`⚠️  WARN: ${warnCount}`)
    console.log(`📝 TOTAL: ${this.results.length}`)

    console.log(`\n📋 DETAILED RESULTS:`)
    this.results.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
      console.log(`${index + 1}. ${icon} ${result.test}: ${result.message}`)

      if (result.error) {
        console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`)
      }
    })

    // Generate recommendations
    if (failCount > 0) {
      console.log('\n🔧 RECOMMENDATIONS:')
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`• Fix: ${result.test} - ${result.message}`)
        })
    }
  }

  // 🚀 Run All Tests
  async runAllTests(testUserId: string): Promise<void> {
    console.log('🚀 Starting MealAppeal Database Tests...\n')

    try {
      // Run all test suites
      const schemaResults = await this.testDatabaseSchema()
      this.results.push(...schemaResults)

      const insertResult = await this.testMealInsertion(testUserId)
      this.results.push(insertResult)

      const retrievalResult = await this.testMealsRetrieval(testUserId)
      this.results.push(retrievalResult)

      const rlsResults = await this.testRLSPolicies()
      this.results.push(...rlsResults)

      const performanceResults = await this.testPerformance(testUserId)
      this.results.push(...performanceResults)

      const e2eResults = await this.testEndToEndWorkflow(testUserId)
      this.results.push(...e2eResults)

      // Generate final report
      this.generateReport()
    } catch (error) {
      console.error('🚨 Test suite failed:', error)
    }
  }
}

// 🎯 Export test runner
export async function runMealAppealDatabaseTests(testUserId: string = 'test-user-id') {
  const tester = new MealAppealDatabaseTester()
  await tester.runAllTests(testUserId)
}

// Usage example:
// runMealAppealDatabaseTests('your-test-user-id-here')
