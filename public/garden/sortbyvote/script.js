    const votingBalls = ['🔴', '🟣', '🟤', '🟡', '🟢'];
    const ballRegex = /[🔴🟣🟤🟡🟢]/g;

    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const formatBtn = document.getElementById('formatBtn');
    const copyInputBtn = document.getElementById('copyInputBtn');
    const copyOutputBtn = document.getElementById('copyOutputBtn');
    const removeVotesBtn = document.getElementById('removeVotesBtn');
    const inputStats = document.getElementById('inputStats');
    const outputStats = document.getElementById('outputStats');

    const canvas = document.getElementById('measureCanvas');
    const ctx = canvas.getContext('2d');
    ctx.font = '16px "Arial"';

    let formatTimeout;

    function calculatePixelWidth(text) {
      return ctx.measureText(text).width;
    }

    function formatAndSort() {
      const lines = input.value.split('\n').filter(line => line.trim() !== '');
     
      if (lines.length === 0) {
        output.value = '';
        updateStats();
        return;
      }

      const processedLines = lines.map(line => {
        const textOnly = line.replace(ballRegex, '').trim();
       
        const matches = line.match(ballRegex);
        const presentBalls = matches ? matches : [];
       
        const sortedBalls = presentBalls.sort((a, b) => {
          return votingBalls.indexOf(a) - votingBalls.indexOf(b);
        });
       
        const balls = sortedBalls.join('');
        const formatted = balls.length > 0 ? `${textOnly} ${balls}` : textOnly;
        const ballCount = sortedBalls.length;
       
        return {
          text: textOnly,
          ballCount,
          width: calculatePixelWidth(textOnly),
          formatted
        };
      });

      const grouped = new Map();
      processedLines.forEach(line => {
        if (!grouped.has(line.ballCount)) {
          grouped.set(line.ballCount, []);
        }
        grouped.get(line.ballCount).push(line);
      });

      grouped.forEach(group => {
        group.sort((a, b) => a.width - b.width);
      });

      const sortedCounts = Array.from(grouped.keys()).sort((a, b) => b - a);

      const outputLines = [];
      sortedCounts.forEach((count, index) => {
        const group = grouped.get(count);
        group.forEach(line => {
          outputLines.push(line.formatted);
        });
        if (index < sortedCounts.length - 1) {
          outputLines.push('');
        }
      });

      output.value = outputLines.join('\n');
      updateStats();
    }

    function updateStats() {
      const lines = input.value.split('\n').filter(line => line.trim() !== '');
     
      if (lines.length === 0) {
        inputStats.innerHTML = '';
      } else {
        const voteCounts = new Map();
        lines.forEach(line => {
          const matches = line.match(ballRegex);
          const ballCount = matches ? matches.length : 0;
          voteCounts.set(ballCount, (voteCounts.get(ballCount) || 0) + 1);
        });

        let statsHTML = `<strong>${lines.length} lines</strong>`;
       
        if (voteCounts.size > 0) {
          const breakdown = Array.from(voteCounts.entries())
            .sort((a, b) => b[0] - a[0])
            .map(([count, num]) => `${num} with ${count} vote${count !== 1 ? 's' : ''}`)
            .join(', ');
          statsHTML += `<span class="vote-breakdown"> • ${breakdown}</span>`;
        }
       
        inputStats.innerHTML = statsHTML;
      }

      if (!output.value.trim()) {
        outputStats.innerHTML = '';
      } else {
        const groups = output.value.split('\n\n').filter(g => g.trim() !== '');
        const totalLines = output.value.split('\n').filter(l => l.trim() !== '').length;
        outputStats.innerHTML = `${groups.length} vote group${groups.length !== 1 ? 's' : ''} • ${totalLines} lines total`;
      }
    }

    async function copyToClipboard(text, button) {
      if (!text.trim()) return;
     
      try {
        await navigator.clipboard.writeText(text);
        button.classList.add('copied');
        button.textContent = '✓ COPIED';
       
        setTimeout(() => {
          button.classList.remove('copied');
          button.textContent = 'Copy';
        }, 1500);
      } catch (e) {
        console.error('Failed to copy', e);
      }
    }

    input.addEventListener('input', () => {
      clearTimeout(formatTimeout);
      formatTimeout = setTimeout(formatAndSort, 300);
    });

    formatBtn.addEventListener('click', formatAndSort);
    copyInputBtn.addEventListener('click', () => copyToClipboard(input.value, copyInputBtn));
    copyOutputBtn.addEventListener('click', () => copyToClipboard(output.value, copyOutputBtn));

    removeVotesBtn.addEventListener('click', () => {
      if (!output.value.trim()) return;

      const linesWithoutVotes = output.value
        .split('\n')
        .map(line => line.replace(ballRegex, '').trim())
        .filter(line => line !== '');

      output.value = linesWithoutVotes.join('\n');
      updateStats();
    });

    document.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const emoji = btn.getAttribute('data-emoji');
        const originalEmoji = btn.textContent;

        try {
          await navigator.clipboard.writeText(emoji);

          btn.textContent = '✅';
          btn.classList.add('copied');

          setTimeout(() => {
            btn.style.opacity = '0';
            setTimeout(() => {
              btn.textContent = originalEmoji;
              btn.style.opacity = '1';
              btn.classList.remove('copied');
            }, 300);
          }, 1000);
        } catch (e) {
          console.error('Failed to copy emoji', e);
        }
      });
    });

    copyAllEmojisBtn.addEventListener('click', () => {
      const all = votingBalls.join('');
      copyToClipboard(all, copyAllEmojisBtn);
    });

    input.addEventListener('input', () => {
      clearTimeout(formatTimeout);
      formatTimeout = setTimeout(formatAndSort, 300);
    });

    formatBtn.addEventListener('click', formatAndSort);
    copyInputBtn.addEventListener('click', () => copyToClipboard(input.value, copyInputBtn));
    copyOutputBtn.addEventListener('click', () => copyToClipboard(output.value, copyOutputBtn));

    updateStats();

    
    updateStats();
