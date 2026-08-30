// Word-level diffing with character-level playback.
//
// The five bios share long verbatim runs, so the diff has to work in words —
// that is what lets "in his free time" sit still while the sentence around it
// rewrites. Playback then works in characters, so the parts that DO change read
// as being typed rather than swapped.

export type Op = { type: 'keep' | 'del' | 'ins'; text: string }

/** Split into word-plus-trailing-whitespace, so joining ops restores the text exactly. */
const tokenise = (text: string): string[] => text.match(/\S+\s*/g) ?? []

/**
 * Longest common subsequence over tokens, walked back into a keep/del/ins list.
 * Bios top out around 200 words, so the table is ~40k cells — cheap, and this
 * runs once per adjacent pair at module load rather than during interaction.
 */
export function diff (from: string, to: string): Op[] {
  const a = tokenise(from)
  const b = tokenise(to)

  const lcs: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0))

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j]
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const ops: Op[] = []
  const push = (type: Op['type'], text: string) => {
    const tail = ops[ops.length - 1]
    if (tail && tail.type === type) tail.text += text   // merge runs
    else ops.push({ type, text })
  }

  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { push('keep', a[i]); i++; j++ }
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) { push('del', a[i]); i++ }
    else { push('ins', b[j]); j++ }
  }
  while (i < a.length) push('del', a[i++])
  while (j < b.length) push('ins', b[j++])

  return ops
}

/** Total characters that have to move for the whole transition. */
export const cost = (ops: Op[]): number =>
  ops.reduce((n, op) => n + (op.type === 'keep' ? 0 : op.text.length), 0)

/**
 * The state of the paragraph at progress 0..1.
 *
 * A single character budget is spent left to right, so the rewrite sweeps
 * across the paragraph instead of erasing everything and retyping it. Pure —
 * given the same progress it returns the same string, which is what makes
 * scrubbing backwards rewind exactly and needs no animation state to unwind.
 */
export function render (ops: Op[], progress: number): { text: string; caret: number | null } {
  const total = cost(ops)
  const done = Math.round(Math.max(0, Math.min(1, progress)) * total)

  let out = ''
  let spent = 0
  let caret: number | null = null

  for (const op of ops) {
    if (op.type === 'keep') { out += op.text; continue }

    const budget = Math.max(0, Math.min(op.text.length, done - spent))

    // Both erode/grow from the SAME edge, so a replacement backspaces away and
    // the new text types in at one spot. Eroding a deletion from its start
    // instead would strip words of their heads and leave the tails drifting.
    const visible = op.type === 'del'
      ? op.text.slice(0, op.text.length - budget)
      : op.text.slice(0, budget)

    // the caret sits wherever the budget ran out — the live edge of the rewrite
    if (caret === null && budget > 0 && budget < op.text.length) {
      caret = out.length + visible.length
    }

    out += visible
    spent += op.text.length
  }

  return { text: out, caret }
}
