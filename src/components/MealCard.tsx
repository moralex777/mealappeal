import { ChefHat, Clock, Crown, Heart, Star, Target, Zap } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { type IMealCardProps } from '@/lib/types'

import ResponsiveImage from './ResponsiveImage'

export function MealCard({
  meal,
  profile,
  formatDate,
  getDaysLeft,
}: IMealCardProps): React.ReactElement {
  const [isLiked, setIsLiked] = useState(false)
  const [showDetailedNutrition, setShowDetailedNutrition] = useState(false)

  const daysLeft = meal.scheduled_deletion_date ? getDaysLeft(meal.scheduled_deletion_date) : null
  const isExpiringSoon = typeof daysLeft === 'number' && daysLeft <= 3
  const isPremium = profile?.subscription_tier === 'premium'

  // Enhanced smart analysis calculations
  const healthScore = meal.analysis
    ? Math.min(
        10,
        Math.max(
          1,
          (meal.analysis.protein || 0) * 0.3 +
            (meal.analysis.carbs || 0) * 0.15 +
            (10 - (meal.analysis.fat || 0) * 0.12) +
            2
        )
      )
    : 8.2

  const rating = (healthScore / 2).toFixed(1) // Convert to 5-star scale

  // Smart-generated food insights
  const getFoodCategory = () => {
    const calories = meal.analysis?.calories || 0
    const protein = meal.analysis?.protein || 0

    if (protein > 20) {
      return { label: '🏋️ High Protein', color: 'bg-blue-100 text-blue-800' }
    }
    if (calories < 300) {
      return { label: '🌱 Light & Fresh', color: 'bg-green-100 text-green-800' }
    }
    if (calories > 600) {
      return { label: '💪 Energy Dense', color: 'bg-orange-100 text-orange-800' }
    }
    return { label: '⚖️ Balanced', color: 'bg-purple-100 text-purple-800' }
  }

  const foodCategory = getFoodCategory()

  return (
    <Card className="group overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50/30 shadow-lg transition-all duration-500 hover:shadow-xl">
      {/* Hero Image Section */}
      <div className="relative aspect-square overflow-hidden">
        <ResponsiveImage
          src={meal.image_url}
          alt={meal.analysis?.name || 'Analyzed Delicious Meal'}
          className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
        />

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

        {/* Health Score Badge */}
        <div className="absolute top-4 left-4 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white/30 bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl backdrop-blur-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{healthScore.toFixed(1)}</div>
            <div className="text-xs font-medium text-white/90">SCORE</div>
          </div>
        </div>

        {/* Top Right Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {isPremium && (
            <Badge className="border-0 bg-gradient-to-r from-amber-400 to-orange-400 text-amber-900 shadow-lg">
              <Crown className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          )}

          {isExpiringSoon && !isPremium && (
            <Badge variant="destructive" className="animate-pulse shadow-lg">
              <Clock className="mr-1 h-3 w-3" />
              {daysLeft}d left!
            </Badge>
          )}
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute right-4 bottom-4 left-4 flex translate-y-full items-center justify-between opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={() => setIsLiked(!isLiked)}
            aria-label={isLiked ? 'Unlike this meal' : 'Like this meal'}
            className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 shadow-lg backdrop-blur-lg transition-all duration-300 ${
              isLiked
                ? 'scale-110 bg-gradient-to-r from-red-400 to-pink-500 text-white'
                : 'bg-white/90 text-gray-700 hover:scale-110 hover:bg-gradient-to-r hover:from-red-400 hover:to-pink-500 hover:text-white'
            }`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>

        </div>
      </div>

      {/* Detailed Analysis Content */}
      <CardContent className="space-y-4 p-6">
        {/* Food Name & Rating */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl leading-tight font-bold text-gray-900">
              {meal.analysis?.name || 'Detected Delicious Meal'}
              <span className="ml-2 text-lg">✨</span>
            </h3>
            <div className="flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-yellow-100 to-amber-100 px-3 py-2 shadow-sm">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-bold text-yellow-800">{rating}</span>
            </div>
          </div>

          {/* Food Category & Date */}
          <div className="flex items-center gap-3">
            <Badge className={`${foodCategory.color} border-0 font-medium`}>
              {foodCategory.label}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <ChefHat className="h-3 w-3" />
              {formatDate(meal.created_at)}
            </span>
          </div>
        </div>

        {/* Nutrition Analysis Toggle */}
        <button
          onClick={() => setShowDetailedNutrition(!showDetailedNutrition)}
          className="w-full rounded-2xl border border-teal-200/50 bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 p-4 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:from-teal-100 hover:via-cyan-100 hover:to-teal-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 shadow-sm">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-teal-800">
                {showDetailedNutrition ? 'Hide' : 'Show'} Nutrition Analysis
              </span>
            </div>
            <Target
              className={`h-5 w-5 text-teal-600 transition-transform duration-300 ${showDetailedNutrition ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {/* Detailed Nutrition Grid */}
        <div
          className={`overflow-hidden transition-all duration-700 ease-in-out ${showDetailedNutrition ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="rounded-2xl bg-gradient-to-br from-orange-400 via-red-400 to-orange-500 p-4 text-white shadow-lg">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-white/80"></div>
                <span className="text-xs font-bold tracking-wider opacity-90">ENERGY</span>
              </div>
              <div className="text-2xl font-bold">{meal.analysis?.calories || 0}</div>
              <div className="text-xs opacity-80">kcal · Analyzed</div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-4 text-white shadow-lg">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-white/80"></div>
                <span className="text-xs font-bold tracking-wider opacity-90">PROTEIN</span>
              </div>
              <div className="text-2xl font-bold">{meal.analysis?.protein || 0}</div>
              <div className="text-xs opacity-80">grams · Muscle fuel</div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 p-4 text-white shadow-lg">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-white/80"></div>
                <span className="text-xs font-bold tracking-wider opacity-90">CARBS</span>
              </div>
              <div className="text-2xl font-bold">{meal.analysis?.carbs || 0}</div>
              <div className="text-xs opacity-80">grams · Quick energy</div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 p-4 text-white shadow-lg">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-white/80"></div>
                <span className="text-xs font-bold tracking-wider opacity-90">FATS</span>
              </div>
              <div className="text-2xl font-bold">{meal.analysis?.fat || 0}</div>
              <div className="text-xs opacity-80">grams · Healthy fats</div>
            </div>
          </div>
        </div>

        {/* Storage Status */}
        {!isPremium ? (
          <div className="rounded-2xl border border-orange-200/60 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-red-500 shadow-sm">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-orange-800">
                    {typeof daysLeft === 'number'
                      ? isExpiringSoon
                        ? `⚠️ Analysis expires in ${daysLeft} days!`
                        : `${daysLeft} days remaining`
                      : 'Free Analysis'}
                  </div>
                  <div className="text-xs text-orange-600">Upgrade for unlimited insights</div>
                </div>
              </div>
              <button className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl">
                Upgrade ↗
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-emerald-800">Premium Analysis Complete ✨</div>
                <div className="text-xs text-emerald-600">
                  Unlimited storage • Advanced insights • Priority support
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Smart Analysis Badge */}
        <div className="flex items-center justify-center border-t border-gray-100 pt-2">
          <div className="rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm">
            ✨ Smart Analysis
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
