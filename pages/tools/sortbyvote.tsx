import React, { useEffect, useMemo, useRef, useState } from "react";

const votingBalls = ["🔴", "🟣", "🟤", "🟡", "🟢"] as const;
const ballRegex = /[🔴🟣🟤🟡🟢]/g;

type ProcessedLine = {
  text: string;
  ballCount: number;
  width: number;
  formatted: string;
};

export default function VotingBallFormatter() {
  const [input, setInput] = useState<string>(
    `Make space work better 🔴🟣🟤
Life's Good when things just flow 🔴🟣
Every detail matters 🔴🟣🟤🟡🟢`
  );
  const [output, setOutput] = useState<string>("");
  const [inputStats, setInputStats] = useState<string>("");
  const [outputStats, setOutputStats] = useState<string>("");

  const inputCopyBtnRef = useRef<HTMLButtonElement | null>(null);
  const outputCopyBtnRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    // set a deterministic font for measurement
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.font = '16px "Arial"';
    updateStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function calculatePixelWidth(text: string): number {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return text.length;
    return ctx.measureText(text).width;
  }

  function formatAndSort() {
    const lines = input.split("\n").filter(l => l.trim() !== "");
    if (lines.length === 0) {
      setOutput("");
      updateStats();
      return;
    }

    const processedLines: ProcessedLine[] = lines.map(line => {
      const textOnly = line.replace(ballRegex, "").trim();
      const matches = line.match(ballRegex);
      const presentBalls = matches ? matches : [];

      const sortedBalls = presentBalls.sort(
        (a, b) => votingBalls.indexOf(a as typeof votingBalls[number]) - votingBalls.indexOf(b as typeof votingBalls[number])
      );

      const balls = sortedBalls.join("");
      const formatted = balls.length > 0 ? `${textOnly} ${balls}` : textOnly;
      const ballCount = sortedBalls.length;

      return {
        text: textOnly,
        ballCount,
        width: calculatePixelWidth(textOnly),
        formatted
      };
    });

    const grouped = new Map<number, ProcessedLine[]>();
    processedLines.forEach(line => {
      if (!grouped.has(line.ballCount)) grouped.set(line.ballCount, []);
      grouped.get(line.ballCount)!.push(line);
    });

    grouped.forEach(group => {
      group.sort((a, b) => a.width - b.width);
    });

    const sortedCounts = Array.from(grouped.keys()).sort((a, b) => b - a);

    const outputLines: string[] = [];
    sortedCounts.forEach((count, index) => {
      const group = grouped.get(count)!;
      group.forEach(line => outputLines.push(line.formatted));
      if (index < sortedCounts.length - 1) outputLines.push("");
    });

    setOutput(outputLines.join("\n"));
    updateStats(outputLines.join("\n"));
  }

  function updateStats(forcedOutput?: string) {
    const lines = input.split("\n").filter(l => l.trim() !== "");
    if (lines.length === 0) {
      setInputStats("");
    } else {
      const voteCounts = new Map<number, number>();
      lines.forEach(line => {
        const matches = line.match(ballRegex);
        const count = matches ? matches.length : 0;
        voteCounts.set(count, (voteCounts.get(count) || 0) + 1);
      });

      let stats = `<strong>${lines.length} lines</strong>`;
      if (voteCounts.size > 0) {
        const breakdown = Array.from(voteCounts.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([count, num]) => `${num} with ${count} vote${count !== 1 ? "s" : ""}`)
          .join(", ");
        stats += ` <span class="vote-breakdown"> • ${breakdown}</span>`;
      }
      setInputStats(stats);
    }

    const outText = typeof forcedOutput === "string" ? forcedOutput : output;
    if (!outText.trim()) {
      setOutputStats("");
    } else {
      const groups = outText.split("\n\n").filter(g => g.trim() !== "");
      const totalLines = outText.split("\n").filter(l => l.trim() !== "").length;
      setOutputStats(`${groups.length} vote group${groups.length !== 1 ? "s" : ""} • ${totalLines} lines total`);
    }
  }

  async function copyToClipboard(text: string, btnRef: React.RefObject<HTMLButtonElement>) {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      const btn = btnRef.current;
      if (!btn) return;
      btn.classList.add("copied");
      const original = btn.textContent || "Copy";
      btn.textContent = "✓ COPIED";
      window.setTimeout(() => {
        btn.classList.remove("copied");
        btn.textContent = original;
      }, 1500);
    } catch (e) {
      // no-op
      // eslint-disable-next-line no-console
      console.error("Failed to copy", e);
    }
  }

  // auto format with debounce on input
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      formatAndSort();
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const handleManualFormat = () => {
    formatAndSort();
  };

  const inputStatsMarkup = useMemo(() => ({ __html: inputStats }), [inputStats]);

  return (
    <main className="container">
      <h1>Voting ball formatter</h1>
      <p className="subtitle">
        Clean up your copy voting lists automatically — formats balls, groups by votes, sorts by length
      </p>

      <div className="controls">
        <button id="formatBtn" onClick={handleManualFormat}>Format and sort now</button>
        <div className="info-text">
          Auto-formats as you type • Groups by vote count • Sorts each group by pixel width
        </div>
      </div>

      <div className="content">
        <section className="panel">
          <div className="panel-header">
            <span>Input</span>
            <button
              className="copy-btn"
              id="copyInputBtn"
              ref={inputCopyBtnRef}
              onClick={() => copyToClipboard(input, inputCopyBtnRef)}
            >
              Copy
            </button>
          </div>

          <textarea
            id="input"
            className="input-area"
            placeholder={`Paste your copy with voting balls here...
Make space work better 🔴🟣🟤
Life's Good when things just flow 🔴🟣
Every detail matters 🔴🟣🟤🟡🟢`}
            value={input}
            onChange={e => {
              setInput(e.target.value);
            }}
          />

          <div className="stats" id="inputStats" dangerouslySetInnerHTML={inputStatsMarkup} />
        </section>

        <section className="panel">
          <div className="panel-header">
            <span>Formatted (most votes → least)</span>
            <button
              className="copy-btn"
              id="copyOutputBtn"
              ref={outputCopyBtnRef}
              onClick={() => copyToClipboard(output, outputCopyBtnRef)}
            >
              Copy
            </button>
          </div>

          <textarea
            id="output"
            className="output-area"
            readOnly
            placeholder="Formatted and sorted lines will appear here..."
            value={output}
          />

          <div className="stats" id="outputStats">{outputStats}</div>
        </section>
      </div>

      <canvas id="measureCanvas" ref={canvasRef} style={{ display: "none" }} />

      <style>{`
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: var(--color-bg); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
        .container { max-width: 1400px; margin: 0 auto; padding: 40px 20px; color: var(--color-text); }
        h1 { font-size: 28px; font-weight: 600; margin-bottom: 12px; color: var(--color-text-dark); }
        .subtitle { color: var(--color-text-light); margin-bottom: 32px; font-size: 15px; }
        .content { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 20px; }
        .panel { background: var(--color-white); border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .panel-header { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-light); margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
        .copy-btn { padding: 6px 12px; min-width: 85px; font-size: 11px; font-weight: 600; line-height: 1; text-transform: uppercase; letter-spacing: 0.5px; background: var(--color-btn-bg); color: var(--color-text-light); border: 1px solid var(--color-border-dark); border-radius: 4px; cursor: pointer; transition: all 0.2s; display: inline-block; text-align: center; white-space: nowrap; width: 85px; }
        .copy-btn:hover { background: var(--color-btn-hover); border-color: var(--color-border-darker); color: var(--color-text); }
        .copy-btn.copied { background: var(--color-primary); color: var(--color-white); border-color: var(--color-primary); }
        textarea { width: 100%; min-height: 400px; padding: 16px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 16px; line-height: 1.6; resize: vertical; transition: border-color 0.2s; font-family: "Arial", sans-serif; }
        textarea:focus { outline: none; border-color: var(--color-primary); }
        .input-area { background: var(--color-input-bg); }
        .output-area { background: var(--color-output-bg); color: var(--color-text-subtle); }
        .controls { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-bottom: 1.5em; }
        .info-text { font-size: 13px; color: var(--color-text-lighter); }
        button { background: var(--color-primary); color: var(--color-white); border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        button:hover { background: var(--color-primary-dark); }
        .stats { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--color-border); font-size: 13px; color: var(--color-text-lighter); }
        .vote-breakdown { color: var(--color-text-lighter); }
        @media (max-width: 900px) { .content { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
