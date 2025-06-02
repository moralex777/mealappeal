import React from 'react'

const MealCardSkeleton = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20">
      {/* Image skeleton */}
      <div className="aspect-square bg-gray-200 animate-pulse" />

      {/* Content skeleton */}
      <div className="p-4 space-y-4">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded-md w-3/4 animate-pulse" />
        
        {/* Stats skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded-md w-1/2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded-md w-2/3 animate-pulse" />
        </div>
        
        {/* Nutrition skeleton */}
        <div>
          <div className="h-5 bg-gray-200 rounded-md w-1/3 mb-2 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded-md w-1/2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded-md w-2/5 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded-md w-3/5 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded-md w-2/5 animate-pulse" />
          </div>
        </div>

        {/* Date and storage skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded-md w-1/3 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded-md w-1/4 animate-pulse" />
        </div>
      </div>
    </div>
  )

export default MealCardSkeleton 