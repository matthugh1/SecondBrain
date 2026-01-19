interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export default function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  )
}
