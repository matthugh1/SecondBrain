interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export default function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-lg p-5 transition-all duration-300 hover:bg-surface hover:-translate-y-1 hover:shadow-primary/20 group">
      <h3 className="text-xs font-bold text-textMuted uppercase tracking-widest transition-colors group-hover:text-primary">
        {title}
      </h3>
      <p className="text-3xl font-black text-textPrimary mt-2 tracking-tight">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-textMuted mt-1 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  )
}
