import { useEffect, useMemo, useState } from "react"

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [items])

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  )

  return { page, pageCount, current, setPage }
}
