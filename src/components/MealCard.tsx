import { type IMealCardProps } from '@/lib/types'
import { Clock } from 'lucide-react'
import ResponsiveImage from './ResponsiveImage'

export function MealCard({ meal, profile, formatDate, getDaysLeft }: IMealCardProps): React.ReactElement {
  const daysLeft = meal.scheduled_deletion_date ? getDaysLeft(meal.scheduled_deletion_date) : null
  const isExpiringSoon = typeof daysLeft === 'number' && daysLeft <= 3

  return (
    <div className="glass-effect rounded-2xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
      <div className="relative aspect-square">
        <ResponsiveImage
          src={meal.image_url}
          alt={meal.analysis?.name || 'Meal photo'}
          className="object-cover"
          width={800}
          height={800}
          sizes="(max-width: 768px) 100vw, 400px"
          priority={false}
          quality={85}
        />
        {isExpiringSoon && profile?.subscription_tier !== 'premium' && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {daysLeft} days left
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{meal.analysis?.name || 'Delicious Meal'}</h3>

        {/* Nutrition Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div>
            <div className="text-muted-foreground">Calories</div>
            <div className="font-medium">{meal.analysis?.calories || '0'}kcal</div>
          </div>
          <div>
            <div className="text-muted-foreground">Protein</div>
            <div className="font-medium">{meal.analysis?.protein || '0'}g</div>
          </div>
          <div>
            <div className="text-muted-foreground">Carbs</div>
            <div className="font-medium">{meal.analysis?.carbs || '0'}g</div>
          </div>
          <div>
            <div className="text-muted-foreground">Fat</div>
            <div className="font-medium">{meal.analysis?.fat || '0'}g</div>
          </div>
        </div>

        {/* Date and Storage Info */}
        <div className="text-xs text-muted-foreground mt-4 flex justify-between items-center">
          <span>{formatDate(meal.created_at)}</span>
          {profile?.subscription_tier !== 'premium' && (
            <span className={`flex items-center gap-1 ${isExpiringSoon ? 'text-red-500 font-medium' : ''}`}>
              <Clock className="w-3 h-3" />
              {typeof daysLeft === 'number' ? `${daysLeft} days left` : 'Unlimited storage'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
