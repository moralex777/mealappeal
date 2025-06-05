import { Clock, Utensils } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useMemo, useState } from 'react'

import { type IMealCardProps } from '@/lib/types'

export function MealCard({
  meal,
  profile,
  formatDate,
  getDaysLeft,
}: IMealCardProps): React.ReactElement {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Memoized calculations for better performance
  const daysLeft = useMemo(
    () => (meal.scheduled_deletion_date ? getDaysLeft(meal.scheduled_deletion_date) : null),
    [meal.scheduled_deletion_date, getDaysLeft]
  )

  const isExpiringSoon = useMemo(() => typeof daysLeft === 'number' && daysLeft <= 3, [daysLeft])

  const isPremium = useMemo(
    () => profile?.subscription_tier === 'premium',
    [profile?.subscription_tier]
  )

  // Optimized image source handling
  const imageSrc = useMemo(() => {
    if (!meal.image_url || imageError) {
      return '/placeholder-meal.svg'
    }
    return meal.image_url
  }, [meal.image_url, imageError])

  const isDataUrl = useMemo(() => imageSrc.startsWith('data:'), [imageSrc])

  // Image error handler
  const handleImageError = useCallback(() => {
    console.warn('Image failed to load:', meal.image_url)
    setImageError(true)
    setImageLoading(false)
  }, [meal.image_url])

  const handleImageLoad = useCallback(() => {
    setImageLoading(false)
  }, [])

  // Nutrition data with proper fallbacks
  const nutrition = useMemo(
    () => ({
      calories: meal.analysis?.calories || 0,
      protein: meal.analysis?.protein || 0,
      carbs: meal.analysis?.carbs || 0,
      fat: meal.analysis?.fat || 0,
    }),
    [meal.analysis]
  )

  // Expiration warning styling
  const expirationStyle = useMemo(() => {
    if (!isExpiringSoon || isPremium) {
      return ''
    }

    if (typeof daysLeft === 'number') {
      if (daysLeft === 0) {
        return 'bg-red-600 animate-pulse'
      }
      if (daysLeft <= 1) {
        return 'bg-red-500'
      }
      if (daysLeft <= 3) {
        return 'bg-orange-500'
      }
    }
    return 'bg-gray-500'
  }, [isExpiringSoon, isPremium, daysLeft])

  return (
    <div className="glass-effect group transform overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
      {/* Image Section */}
      <div className="relative aspect-square bg-gray-100">
        {/* Loading placeholder */}
        {imageLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Utensils className="h-8 w-8 animate-pulse" />
              <span className="text-xs">Loading...</span>
            </div>
          </div>
        )}

        {/* Image Display */}
        {isDataUrl ? (
          <img
            src={imageSrc}
            alt={meal.analysis?.name || 'Delicious meal'}
            className="h-full w-full object-cover transition-opacity duration-300"
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <Image
            src={imageSrc}
            alt={meal.analysis?.name || 'Delicious meal'}
            fill
            className="object-cover transition-opacity duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            quality={85}
            onLoad={handleImageLoad}
            onError={handleImageError}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyBYhwb0LcPcnuR0GY7o0g2t5bvP0HjnWl3+PZ8q+Mz2E8jZo5D7oHq9j1i7e0PptO6ckQDH7Qg0djC7tYhFEE4LkNlRQvUHg4oSRBttT5l8J+QLs5N9H9DL+q+o1t5xJz7UUEqJCUIIBGIDrY4UH/Z"
          />
        )}

        {/* Expiration Warning Badge */}
        {isExpiringSoon && !isPremium && (
          <div
            className={`absolute top-3 right-3 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white shadow-lg ${expirationStyle}`}
          >
            <Clock className="h-3 w-3" />
            <span>
              {typeof daysLeft === 'number'
                ? daysLeft === 0
                  ? 'Expires today!'
                  : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
                : 'Expiring soon'}
            </span>
          </div>
        )}

        {/* Premium Badge */}
        {isPremium && (
          <div className="absolute top-3 left-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-2 py-1 text-xs font-bold text-white shadow-lg">
            👑 Premium
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Meal Title */}
        <div className="mb-4">
          <h3 className="group-hover:text-brand-600 text-lg leading-tight font-bold text-gray-900 transition-colors">
            {meal.analysis?.name || 'Delicious Meal'}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <span>📅 {formatDate(meal.created_at)}</span>
            {nutrition.calories > 0 && (
              <>
                <span>•</span>
                <span className="font-medium">⚡ {nutrition.calories} kcal</span>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Nutrition Grid */}
        <div className="mb-4 space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            📊 Nutrition Breakdown
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {/* Calories */}
            <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-100 p-3 text-center">
              <div className="text-xs font-medium text-emerald-700">Energy</div>
              <div className="text-lg font-bold text-emerald-800">
                {nutrition.calories}
                <span className="text-xs font-normal"> kcal</span>
              </div>
            </div>

            {/* Protein */}
            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 p-3 text-center">
              <div className="text-xs font-medium text-indigo-700">Protein</div>
              <div className="text-lg font-bold text-indigo-800">
                {nutrition.protein}
                <span className="text-xs font-normal">g</span>
              </div>
            </div>

            {/* Carbs */}
            <div className="rounded-lg bg-gradient-to-br from-amber-50 to-yellow-100 p-3 text-center">
              <div className="text-xs font-medium text-amber-700">Carbs</div>
              <div className="text-lg font-bold text-amber-800">
                {nutrition.carbs}
                <span className="text-xs font-normal">g</span>
              </div>
            </div>

            {/* Fat */}
            <div className="rounded-lg bg-gradient-to-br from-purple-50 to-violet-100 p-3 text-center">
              <div className="text-xs font-medium text-violet-700">Fat</div>
              <div className="text-lg font-bold text-violet-800">
                {nutrition.fat}
                <span className="text-xs font-normal">g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Info Footer */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              {isPremium ? (
                <span className="flex items-center gap-1 font-medium text-yellow-600">
                  ♾️ Unlimited storage
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  ⏳ {typeof daysLeft === 'number' ? `${daysLeft} days left` : '14 days storage'}
                </span>
              )}
            </span>

            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Auto-saved</span>
            </div>
          </div>

          {/* Upgrade prompt for free users with expiring meals */}
          {!isPremium && isExpiringSoon && (
            <div className="mt-2 rounded-md bg-gradient-to-r from-orange-500 to-red-500 p-2 text-center">
              <p className="text-xs font-medium text-white">
                💫 Upgrade to Premium for unlimited storage!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
