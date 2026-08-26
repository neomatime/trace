export function DomainPlaceholder({ name }: { name: string }) {
  return (
    <div data-placeholder="true" className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
      {name} is not implemented yet.
    </div>
  )
}
