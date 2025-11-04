import React, { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'

export default function SortByVote() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctx = useMemo(() => {
    if (typeof document === 'undefined') return null
    const c = document.createElement('canvas')
    canvasRef.current = c
    return c.getContext('2d')
  }, [])

  const [input, setInput] = useState<string>('')
  const [output, setOutput] = useState<string>('')

  const [copiedInput, setCopiedInput] = useState<boolean>(false)
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false)
  const [copiedEmojis, setCopiedEmojis] = useState<{ [key: string]: boolean }>({})
  const [copiedAllEmojis, setCopiedAllEmojis] = useState<boolean>(false)

  const votingBalls = ['🔴', '🟣', '🟤', '🟡', '🟢']
  const ballRegex = /[🔴🟣🟤🟡🟢]/g

  type LineWithData = {
    text: string
    ballCount: number
    width: number
    formatted: string
  }

  function calculatePixelWidth(text: string) {
    if (!ctx) return text.length
    ctx.font = '16px "Arial"'
    return ctx.measureText(text).width
  }

  function formatAndSort() {
    const lines = input.split('\n').filter(line => line.trim() !== '')

    if (lines.length === 0) {
      setOutput('')
      return
    }

    const processedLines: LineWithData[] = lines.map(line => {
      // Remove all existing balls and extra whitespace
      const textOnly = line.replace(ballRegex, '').trim()

      // Extract all balls present (including duplicates)
      const matches = line.match(ballRegex)
      const presentBalls = matches ? matches : []

      // Sort balls by their position in the standard order
      const sortedBalls = presentBalls.sort((a, b) => {
        return votingBalls.indexOf(a) - votingBalls.indexOf(b)
      })

      // Create formatted line with text + space + balls (no spaces between balls)
      const balls = sortedBalls.join('')
      const formatted = balls.length > 0 ? `${textOnly} ${balls}` : textOnly
      const ballCount = sortedBalls.length

      return {
        text: textOnly,
        ballCount,
        width: calculatePixelWidth(textOnly),
        formatted
      }
    })

    // Group by vote count (ball count)
    const grouped = new Map<number, LineWithData[]>()
    processedLines.forEach(line => {
      if (!grouped.has(line.ballCount)) {
        grouped.set(line.ballCount, [])
      }
      grouped.get(line.ballCount)!.push(line)
    })

    // Sort each group by pixel width
    grouped.forEach(group => {
      group.sort((a, b) => a.width - b.width)
    })

    // Get vote counts in descending order (most votes first)
    const sortedCounts = Array.from(grouped.keys()).sort((a, b) => b - a)

    // Build output with double space between groups
    const outputLines: string[] = []
    sortedCounts.forEach((count, index) => {
      const group = grouped.get(count)!
      group.forEach(line => {
        outputLines.push(line.formatted)
      })
      // Add double space between groups (except after last group)
      if (index < sortedCounts.length - 1) {
        outputLines.push('')
      }
    })

    setOutput(outputLines.join('\n'))
  }

  function stripBallsFromOutput() {
    if (!output.trim()) return

    // Remove all voting balls from the output
    const strippedText = output
      .replace(ballRegex, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
      .join('\n')

    setOutput(strippedText)
  }

  // Auto-format behavior
  useEffect(() => {
    const t = setTimeout(formatAndSort, 300)
    return () => clearTimeout(t)
  }, [input])

  // Stats
  const inputStats = useMemo(() => {
    const lines = input.split('\n').filter(line => line.trim() !== '')

    if (lines.length === 0) return null

    const voteCounts = new Map<number, number>()
    lines.forEach(line => {
      const matches = line.match(ballRegex)
      const ballCount = matches ? matches.length : 0
      voteCounts.set(ballCount, (voteCounts.get(ballCount) || 0) + 1)
    })

    return {
      lineCount: lines.length,
      voteCounts
    }
  }, [input])

  const outputStats = useMemo(() => {
    if (!output.trim()) return null

    const groups = output.split('\n\n').filter(g => g.trim() !== '')
    const totalLines = output.split('\n').filter(l => l.trim() !== '').length

    return {
      groupCount: groups.length,
      totalLines
    }
  }, [output])

  async function copy(text: string, which: 'input' | 'output') {
    if (!text.trim()) return
    try {
      await navigator.clipboard.writeText(text)
      if (which === 'input') {
        setCopiedInput(true)
        setTimeout(() => setCopiedInput(false), 1500)
      } else {
        setCopiedOutput(true)
        setTimeout(() => setCopiedOutput(false), 1500)
      }
    } catch (e) {
      console.error('Failed to copy', e)
    }
  }

  async function copyEmoji(emoji: string) {
    try {
      await navigator.clipboard.writeText(emoji)
      setCopiedEmojis({ ...copiedEmojis, [emoji]: true })
      setTimeout(() => {
        setCopiedEmojis(prev => ({ ...prev, [emoji]: false }))
      }, 800)
    } catch (e) {
      console.error('Failed to copy', e)
    }
  }

  async function copyAllEmojis() {
    try {
      const all = votingBalls.join('')
      await navigator.clipboard.writeText(all)
      setCopiedAllEmojis(true)
      setTimeout(() => setCopiedAllEmojis(false), 1500)
    } catch (e) {
      console.error('Failed to copy', e)
    }
  }

  return (
    <>
      <Head>
        <title>Sort by vote</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main className="container">
        <h1>Sort by vote</h1>
        <p className="subtitle">
          Use coloured emojis to cast your vote, and then sort by vote count automatically.
        </p>

        {/* Emoji copy widget */}
        <div className="emoji-widget" aria-label="Emoji copy tools">
          <div className="emoji-row">
            {votingBalls.map(emoji => (
              <button
                key={emoji}
                className="emoji-btn"
                type="button"
                onClick={() => copyEmoji(emoji)}
                title={`Copy ${emoji}`}
              >
                {copiedEmojis[emoji] ? '✓' : emoji}
              </button>
            ))}
          </div>
          <button
            className={`copy-all-btn ${copiedAllEmojis ? 'copied' : ''}`}
            type="button"
            onClick={copyAllEmojis}
          >
            {copiedAllEmojis ? '✓ COPIED' : 'Copy all'}
          </button>
          <span className="info-text">Click to copy</span>
        </div>

        <div className="controls">
          <button onClick={formatAndSort}>Cast your votes!</button>
          <div className="info-text">
            Auto-formats as you type • Groups by vote count • Sorts each group by pixel width
          </div>
        </div>

        <div className="content">
          <section className="panel">
            <div className="panel-header">
              <span>Input</span>
              <button
                className={`copy-btn fixed ${copiedInput ? 'copied' : ''}`}
                onClick={() => copy(input, 'input')}
              >
                {copiedInput ? '✓ COPIED' : 'Copy'}
              </button>
            </div>

            <textarea
              className="input-area"
              placeholder="Paste your copy with votes here to be sorted!"
              value={input}
              onChange={e => setInput(e.target.value)}
            />

            <div className="stats">
              {inputStats ? (
                <>
                  <strong>{inputStats.lineCount} lines</strong>
                  {inputStats.voteCounts.size > 0 && (
                    <span className="vote-breakdown">
                      {' • '}
                      {Array.from(inputStats.voteCounts.entries())
                        .sort((a, b) => b[0] - a[0])
                        .map(
                          ([count, num]) =>
                            `${num} with ${count} vote${count !== 1 ? 's' : ''}`
                        )
                        .join(', ')}
                    </span>
                  )}
                </>
              ) : (
                ''
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <span>Output (most votes → least)</span>
              <div className="panel-buttons">
                <button className="strip-btn" onClick={stripBallsFromOutput}>
                  Strip votes
                </button>
                <button
                  className={`copy-btn fixed ${copiedOutput ? 'copied' : ''}`}
                  onClick={() => copy(output, 'output')}
                >
                  {copiedOutput ? '✓ COPIED' : 'Copy'}
                </button>
              </div>
            </div>

            <textarea
              className="output-area"
              readOnly
              placeholder="Formatted and sorted lines will appear here..."
              value={output}
            />

            <div className="stats">
              {outputStats
                ? `${outputStats.groupCount} vote group${outputStats.groupCount !== 1 ? 's' : ''} • ${outputStats.totalLines} lines total`
                : ''}
            </div>
          </section>
        </div>

        {/* hidden canvas for measurements */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </main>

      <style jsx global>{`
        :root {
          --color-primary: #a50034;
          --color-primary-dark: #7a0026;
          --color-bg: #f5f5f5;
          --color-white: #ffffff;
          --color-text: #333;
          --color-text-dark: #1a1a1a;
          --color-text-light: #666;
          --color-text-lighter: #999;
          --color-text-subtle: #555;
          --color-border: #e0e0e0;
          --color-border-dark: #ddd;
          --color-border-darker: #ccc;
          --color-input-bg: #fafafa;
          --color-output-bg: #f9f9f9;
          --color-btn-bg: #f0f0f0;
          --color-btn-hover: #e5e5e5;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          background: var(--color-bg);
          padding: 40px 20px;
          color: var(--color-text);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        }

        h1 {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 12px;
          color: var(--color-text-dark);
        }

        .subtitle {
          color: var(--color-text-light);
          margin-bottom: 32px;
          font-size: 15px;
        }

        .content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 20px;
        }

        .emoji-widget {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .emoji-row {
          display: inline-flex;
          gap: 8px;
          background: var(--color-white);
          border: 1px solid var(--color-border-dark);
          border-radius: 24px;
          padding: 6px 10px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .emoji-btn {
          font-size: 20px;
          line-height: 1;
          padding: 6px 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.15s, transform 0.05s;
        }

        .emoji-btn:hover {
          background: var(--color-btn-hover);
        }

        .emoji-btn:active {
          transform: scale(0.98);
        }

        .copy-all-btn {
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          background: var(--color-btn-bg);
          color: var(--color-text-light);
          border: 1px solid var(--color-border-dark);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .copy-all-btn:hover {
          background: var(--color-btn-hover);
          color: var(--color-text);
          border-color: var(--color-border-darker);
        }

        .copy-all-btn.copied {
          background: var(--color-primary);
          color: var(--color-white);
          border-color: var(--color-primary);
        }

        .panel {
          background: var(--color-white);
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .panel-header {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-text-light);
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .panel-buttons {
          display: flex;
          gap: 8px;
        }

        .copy-btn {
          padding: 6px 12px;
          min-width: 85px;
          font-size: 11px;
          font-weight: 600;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: var(--color-btn-bg);
          color: var(--color-text-light);
          border: 1px solid var(--color-border-dark);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-block;
          text-align: center;
          white-space: nowrap;
        }

        .copy-btn.fixed {
          width: 85px;
        }

        .copy-btn:hover {
          background: var(--color-btn-hover);
          border-color: var(--color-border-darker);
          color: var(--color-text);
        }

        .copy-btn.copied {
          background: var(--color-primary);
          color: var(--color-white);
          border-color: var(--color-primary);
        }

        .strip-btn {
          padding: 6px 12px;
          min-width: 100px;
          font-size: 11px;
          font-weight: 600;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: var(--color-btn-bg);
          color: var(--color-text-light);
          border: 1px solid var(--color-border-dark);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-block;
          text-align: center;
          white-space: nowrap;
          width: 100px;
        }

        .strip-btn:hover {
          background: var(--color-btn-hover);
          border-color: var(--color-border-darker);
          color: var(--color-text);
        }

        textarea {
          width: 100%;
          min-height: 400px;
          padding: 16px;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          font-size: 16px;
          line-height: 1.6;
          resize: vertical;
          transition: border-color 0.2s;
          font-family: 'Arial', sans-serif;
        }

        textarea:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .input-area {
          background: var(--color-input-bg);
        }

        .output-area {
          background: var(--color-output-bg);
          color: var(--color-text-subtle);
        }

        .controls {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 1.5em;
        }

        .info-text {
          font-size: 13px;
          color: var(--color-text-lighter);
        }

        button {
          background: var(--color-primary);
          color: var(--color-white);
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        button:hover {
          background: var(--color-primary-dark);
        }

        .stats {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--color-border);
          font-size: 13px;
          color: var(--color-text-lighter);
        }

        .vote-breakdown {
          color: var(--color-text-lighter);
        }

        @media (max-width: 900px) {
          .content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}
