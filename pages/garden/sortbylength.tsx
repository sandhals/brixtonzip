import React, { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'

export default function SortByLength() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctx = useMemo(() => {
    if (typeof document === 'undefined') return null
    const c = document.createElement('canvas')
    canvasRef.current = c
    return c.getContext('2d')
  }, [])

  const [currentFont, setCurrentFont] = useState<string>('Arial')
  const [input, setInput] = useState<string>('')
  const [output, setOutput] = useState<string>('')

  const [copiedInput, setCopiedInput] = useState<boolean>(false)
  const [copiedOutput, setCopiedOutput] = useState<boolean>(false)

  const [autoSort, setAutoSort] = useState<boolean>(false)

  type LineWithWidth = { text: string; width: number }

  function calculatePixelWidth(text: string, font: string) {
    if (!ctx) return text.length
    ctx.font = `16px "${font}"`
    return ctx.measureText(text).width
  }

  function sortLines() {
    const lines = input.split('\n').filter(line => line.trim() !== '')
    if (lines.length === 0) {
      setOutput('')
      return
    }
    const linesWithWidth: LineWithWidth[] = lines.map(line => ({
      text: line,
      width: calculatePixelWidth(line, currentFont)
    }))

    linesWithWidth.sort((a, b) => a.width - b.width)
    setOutput(linesWithWidth.map(l => l.text).join('\n'))
  }

  // auto sort behavior
  useEffect(() => {
    if (!autoSort) return
    const t = setTimeout(sortLines, 300)
    return () => clearTimeout(t)
  }, [input, currentFont, autoSort])

  // stats
  const stats = useMemo(() => {
    const lines = input.split('\n').filter(line => line.trim() !== '')
    if (lines.length === 0) return null
    const widths = lines.map(l => calculatePixelWidth(l, currentFont))
    const shortest = Math.min(...widths)
    const longest = Math.max(...widths)
    const avg = widths.reduce((a, b) => a + b, 0) / widths.length
    return {
      count: lines.length,
      shortest,
      longest,
      avg
    }
  }, [input, currentFont, ctx])

  const outputStats = useMemo(() => {
    if (!output.trim()) return null
    const lines = output.split('\n')
    const widths = lines.map(l => calculatePixelWidth(l, currentFont))
    const shortest = Math.min(...widths)
    const longest = Math.max(...widths)
    const avg = widths.reduce((a, b) => a + b, 0) / widths.length
    return {
      shortest,
      longest,
      avg
    }
  }, [output, currentFont, ctx])

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

  return (
    <>
      <Head>
        <title>Sort by length</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main className="container">
        <h1>Sort lines by length</h1>
        <p className="subtitle">Sort your lines by actual pixel width, not just character count</p>

        <div className="controls">
          <button onClick={sortLines}>Sort by pixel width</button>

          <label className="auto-sort">
            <input
              type="checkbox"
              checked={autoSort}
              onChange={e => setAutoSort(e.target.checked)}
            />
            Auto sort as you type
          </label>

          <div className="font-selector">
            Font
            <select
              value={currentFont}
              onChange={e => setCurrentFont(e.target.value)}
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Verdana">Verdana</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier New</option>
              <option value="Trebuchet MS">Trebuchet MS</option>
            </select>
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
              id="input"
              className="input-area"
              placeholder={`Paste your lines here...
Each line will be measured
And sorted by visual width`}
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{ fontFamily: `"${currentFont}", sans-serif` }}
            />

            <div className="stats" id="inputStats">
              {stats ? `${stats.count} lines` : ''}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <span>Sorted (shortest → longest)</span>
              <button
                className={`copy-btn fixed ${copiedOutput ? 'copied' : ''}`}
                onClick={() => copy(output, 'output')}
              >
                {copiedOutput ? '✓ COPIED' : 'Copy'}
              </button>
            </div>

            <textarea
              id="output"
              className="output-area"
              readOnly
              placeholder="Sorted lines will appear here..."
              value={output}
              style={{ fontFamily: `"${currentFont}", sans-serif` }}
            />

            <div className="stats" id="outputStats">
              {outputStats
                ? `Shortest: ${outputStats.shortest.toFixed(1)}px | Longest: ${outputStats.longest.toFixed(1)}px | Avg: ${outputStats.avg.toFixed(1)}px`
                : ''}
            </div>
          </section>
        </div>

        {/* hidden canvas for measurements */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </main>

      <style jsx global>{`
  :root {
    --color-primary: #0022ff;
    --color-primary-dark: #05008a;
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

        .panel {
          background: var(--color-white);
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
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

        .font-selector {
          font-size: 12px;
          font-weight: 500;
        }

        .font-selector select {
          margin-left: 8px;
          padding: 4px 8px;
          border: 1px solid var(--color-border-dark);
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          background: var(--color-white);
        }

        .font-selector select:focus {
          outline: none;
          border-color: var(--color-primary);
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
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 1.5em;
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

        .auto-sort {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--color-text-light);
        }

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--color-primary);
        }

        .stats {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--color-border);
          font-size: 13px;
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
