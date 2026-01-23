interface SkeletonCardProps {
  className?: string
}

export default function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`bg-surfaceElevated border border-border/60 rounded-xl shadow-lg p-5 ${className}`}>
      <div className="h-4 w-20 bg-surface/50 rounded animate-pulse mb-4"></div>
      <div className="h-8 w-16 bg-surface/50 rounded animate-pulse"></div>
    </div>
  )
}
