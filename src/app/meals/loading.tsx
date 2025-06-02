export default function MealsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-50 p-4">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">🍽️ Loading your amazing food journey...</p>
        </div>
      </div>
    </div>
  )
} 