        const canvas = document.getElementById('measureCanvas');
        const ctx = canvas.getContext('2d');
        let currentFont = 'Arial';

        function calculatePixelWidth(text, font) {
            ctx.font = `16px "${font}"`;
            return ctx.measureText(text).width;
        }

        function updateFont() {
            currentFont = document.getElementById('fontSelect').value;
            const inputArea = document.getElementById('input');
            const outputArea = document.getElementById('output');
            
            inputArea.style.fontFamily = `"${currentFont}", sans-serif`;
            outputArea.style.fontFamily = `"${currentFont}", sans-serif`;
            
            if (document.getElementById('autoSort').checked && inputArea.value.trim()) {
                sortLines();
            }
        }

        function sortLines() {
            const input = document.getElementById('input').value;
            const lines = input.split('\n').filter(line => line.trim() !== '');
            
            if (lines.length === 0) {
                document.getElementById('output').value = '';
                updateStats([], []);
                return;
            }

            const linesWithWidth = lines.map(line => ({
                text: line,
                width: calculatePixelWidth(line, currentFont)
            }));

            linesWithWidth.sort((a, b) => a.width - b.width);

            const sortedLines = linesWithWidth.map(item => item.text);
            document.getElementById('output').value = sortedLines.join('\n');

            updateStats(linesWithWidth, sortedLines);
        }

        function updateStats(linesWithWidth, sortedLines) {
            const inputStats = document.getElementById('inputStats');
            const outputStats = document.getElementById('outputStats');

            if (linesWithWidth.length === 0) {
                inputStats.textContent = '';
                outputStats.textContent = '';
                return;
            }

            const widths = linesWithWidth.map(l => l.width);
            const shortest = Math.min(...widths);
            const longest = Math.max(...widths);
            const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;

            inputStats.textContent = `${linesWithWidth.length} lines`;
            outputStats.textContent = `Shortest: ${shortest.toFixed(1)}px | Longest: ${longest.toFixed(1)}px | Avg: ${avgWidth.toFixed(1)}px`;
        }

        let autoSortTimeout;
        function handleInput() {
            if (document.getElementById('autoSort').checked) {
                clearTimeout(autoSortTimeout);
                autoSortTimeout = setTimeout(sortLines, 300);
            }
        }

        function handleAutoSort() {
            if (document.getElementById('autoSort').checked) {
                sortLines();
            }
        }

        function copyToClipboard(textareaId, button) {
            const textarea = document.getElementById(textareaId);
            const text = textarea.value;
            
            if (!text.trim()) {
                return;
            }
            
            navigator.clipboard.writeText(text).then(() => {
                const originalText = button.textContent;
                button.textContent = '✓ COPIED';
                button.classList.add('copied');
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                const originalText = button.textContent;
                button.textContent = '✗ FAILED';
                
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            });
        }

        updateFont();
        updateStats([], []);
        document.querySelectorAll('.copy-btn').forEach(btn => btn.classList.add('fixed'));
