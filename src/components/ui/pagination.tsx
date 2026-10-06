export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
}) {
  if (pageCount <= 1) return null

  const pages: (number | "...")[] = []
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("...")
    for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i++)
      pages.push(i)
    if (page < pageCount - 2) pages.push("...")
    pages.push(pageCount)
  }

  return (
    <div className="mt-3 flex items-center justify-between text-sm">
      <p className="text-xs text-deep">
        Page {page} of {pageCount}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="neu-button px-3 py-1 text-xs disabled:opacity-40"
        >
          Prev
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-deep/60">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className="neu-button px-3 py-1 text-xs"
              style={
                p === page
                  ? {
                      background:
                        "color-mix(in srgb, var(--color-teal) 45%, var(--color-cream))",
                    }
                  : undefined
              }
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
          className="neu-button px-3 py-1 text-xs disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}
