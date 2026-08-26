export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-4xl text-[13px] text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

export function PrimaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {children}
    </button>
  )
}
