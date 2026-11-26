/** «2 400»: digits grouped by three with a no-break space, as the claims write them. */
export const formatCount = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/gu, ' ')

/** «1 181,35» or «600»: a flow as the claims write it, with two decimals only when it has them. */
export const formatFlow = (value: number) => {
  const [whole, cents] = value.toFixed(2).split('.')
  return cents === '00' ? formatCount(Number(whole)) : `${formatCount(Number(whole))},${cents}`
}

export type Run = { x: number; y: number; width: number; height: number }

/**
 * The rectangles, in grid cells, that cover units `from` to `to` (end excluded) laid out
 * row by row in `cols` columns: a partial first row, the full rows, a partial last row.
 */
export const runs = (from: number, to: number, cols: number): Run[] => {
  if (to <= from) return []
  const firstRow = Math.floor(from / cols)
  const lastRow = Math.floor((to - 1) / cols)
  if (firstRow === lastRow) {
    return [{ x: from % cols, y: firstRow, width: to - from, height: 1 }]
  }
  const head = from % cols
  const tail = to - lastRow * cols
  const fullFrom = head === 0 ? firstRow : firstRow + 1
  const fullTo = tail === cols ? lastRow + 1 : lastRow
  return [
    ...(head === 0 ? [] : [{ x: head, y: firstRow, width: cols - head, height: 1 }]),
    ...(fullTo > fullFrom ? [{ x: 0, y: fullFrom, width: cols, height: fullTo - fullFrom }] : []),
    ...(tail === cols ? [] : [{ x: 0, y: lastRow, width: tail, height: 1 }]),
  ]
}
