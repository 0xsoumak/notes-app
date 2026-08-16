import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-content-muted">{icon}</div>
      <h1 className="text-content text-lg font-semibold">{title}</h1>
      <p className="text-content-muted max-w-sm text-sm">{description}</p>
      {action}
    </div>
  )
}
