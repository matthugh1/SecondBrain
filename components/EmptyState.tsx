interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 flex flex-col items-center justify-center ${className}`}>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-surfaceElevated flex items-center justify-center mb-4 border border-border">
          {icon}
        </div>
      )}
      <p className="font-medium text-textPrimary text-lg mb-1">{title}</p>
      {description && (
        <p className="text-sm text-textMuted mt-1 max-w-md">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
