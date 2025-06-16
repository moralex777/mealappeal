'use client'

import React from 'react'
import { X, Clock, Flame, Heart, Trophy } from 'lucide-react'
import SmartAnalysisModes from './SmartAnalysisModes'

interface IMeal {
  id: string
  created_at: string
  title: string | null
  description: string | null
  image_url: string
  image_path: string | null
  is_public: boolean
  ai_confidence_score: number | null
  processing_status: string
  scheduled_deletion_date: string | null
  view_count: number
  like_count: number
  basic_nutrition: {
    energy_kcal?: number
    protein_g?: number
    carbs_g?: number
    fat_g?: number
  } | null
  premium_nutrition: any
  health_score: number | null
  meal_tags: string[] | null
}

interface MealDetailModalProps {
  meal: IMeal | null
  isOpen: boolean
  onClose: () => void
  isPremium: boolean
}

export default function MealDetailModal({ meal, isOpen, onClose, isPremium }: MealDetailModalProps) {
  if (!meal || !isOpen) return null

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, padding: '16px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              width: '40px',
              height: '40px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
          </button>
        </div>

        {/* Meal Image */}
        <div style={{ position: 'relative', aspectRatio: '4/3', maxHeight: '400px', overflow: 'hidden', marginTop: '-56px' }}>
          <img
            src={meal.image_url}
            alt={meal.title || 'Meal'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const placeholder = document.createElement('div')
              placeholder.style.cssText = `
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 64px;
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              `
              placeholder.textContent = '🍽️'
              target.parentElement?.appendChild(placeholder)
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent)' }} />

          {/* Time Stamp */}
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
            <Clock style={{ width: '16px', height: '16px' }} />
            <span style={{ fontWeight: '500' }}>
              {formatTime(meal.created_at)}
            </span>
          </div>

          {/* Achievement Badge */}
          <div
            style={{
              background: 'linear-gradient(to right, #9333ea, #ec4899)',
              position: 'absolute',
              left: '16px',
              top: '16px',
              borderRadius: '50px',
              padding: '6px 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Trophy style={{ width: '12px', height: '12px', color: 'white' }} />
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>ANALYZED!</span>
            </div>
          </div>
        </div>

        {/* Meal Info */}
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
              {meal.title || 'Delicious Meal'}
            </h3>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '50px',
                padding: '8px 16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Flame style={{ width: '20px', height: '20px', color: '#ea580c' }} />
              <span style={{ fontWeight: 'bold', color: '#7c3aed', fontSize: '18px' }}>
                {meal.basic_nutrition?.energy_kcal || 0} cal
              </span>
            </div>
          </div>

          {meal.description && (
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>{meal.description}</p>
          )}

          {/* Enhanced Nutrition Bars */}
          <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '4px', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Protein</div>
              <div style={{ marginBottom: '4px', height: '12px', overflow: 'hidden', borderRadius: '50px', backgroundColor: '#dcfce7' }}>
                <div
                  style={{
                    height: '12px',
                    borderRadius: '50px',
                    background: 'linear-gradient(to right, #22c55e, #16a34a)',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                    transition: 'all 1s ease',
                    width: `${Math.min((meal.basic_nutrition?.protein_g || 0) * 2, 100)}%`,
                  }}
                />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#16a34a' }}>
                {meal.basic_nutrition?.protein_g || 0}g
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '4px', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Carbs</div>
              <div style={{ marginBottom: '4px', height: '12px', overflow: 'hidden', borderRadius: '50px', backgroundColor: '#dbeafe' }}>
                <div
                  style={{
                    height: '12px',
                    borderRadius: '50px',
                    background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                    transition: 'all 1s ease',
                    width: `${Math.min((meal.basic_nutrition?.carbs_g || 0) * 1.5, 100)}%`,
                  }}
                />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1d4ed8' }}>
                {meal.basic_nutrition?.carbs_g || 0}g
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '4px', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Fat</div>
              <div style={{ marginBottom: '4px', height: '12px', overflow: 'hidden', borderRadius: '50px', backgroundColor: '#fed7aa' }}>
                <div
                  style={{
                    height: '12px',
                    borderRadius: '50px',
                    background: 'linear-gradient(to right, #f97316, #ea580c)',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                    transition: 'all 1s ease',
                    width: `${Math.min((meal.basic_nutrition?.fat_g || 0) * 3, 100)}%`,
                  }}
                />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ea580c' }}>
                {meal.basic_nutrition?.fat_g || 0}g
              </div>
            </div>
          </div>

          {/* Deep Insights */}
          <div
            style={{
              marginTop: '24px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              overflow: 'hidden',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Analysis Header */}
            <div
              style={{
                background: 'linear-gradient(to right, #9333ea, #ec4899)',
                padding: '20px',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                🤖 Deep Insights
              </h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                {isPremium ? 'Full professional analysis' : 'Health insights available'}
              </p>
            </div>

            {/* Analysis Content */}
            <div style={{ padding: '20px' }}>
              <SmartAnalysisModes meal={meal} />
            </div>
          </div>

          {/* Health Score if available */}
          {meal.health_score && (
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <Heart style={{ width: '24px', height: '24px', color: '#dc2626' }} />
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                Health Score: {meal.health_score}/100
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}