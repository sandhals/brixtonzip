        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const imageUpload = document.getElementById('imageUpload');
        const decimalPlaces = document.getElementById('decimalPlaces');
        const undoBtn = document.getElementById('undoBtn');
        const clearBtn = document.getElementById('clearBtn');
        const statusBar = document.getElementById('statusBar');
        const measurementList = document.getElementById('measurementList');
        const toolBtns = document.querySelectorAll('.tool-btn');

        let image = null;
        let baseMeasurement = null;
        let measurements = [];
        let history = [];
        let isDrawing = false;
        let startPoint = null;
        let clickedNode = null;
        let tempLine = null;
        let selectedTool = 'line';
        let hoveredNode = null;

        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toolBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedTool = btn.dataset.tool;
            });
        });

        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    image = new Image();
                    image.onload = () => {
                        canvas.width = image.width;
                        canvas.height = image.height;
                        saveHistory();
                        baseMeasurement = null;
                        measurements = [];
                        updateUI();
                        setStatus('Draw first shape to set base');
                        redraw();
                    };
                    image.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        undoBtn.addEventListener('click', () => {
            if (history.length > 0) {
                const state = history.pop();
                baseMeasurement = state.baseMeasurement;
                measurements = state.measurements;
                updateUI();
                redraw();
            }
        });

        clearBtn.addEventListener('click', () => {
            saveHistory();
            baseMeasurement = null;
            measurements = [];
            updateUI();
            setStatus('Draw first shape to set base');
            redraw();
        });

        function findNearNode(x, y, threshold = 10) {
            if (baseMeasurement) {
                if (calculateDistance({x, y}, baseMeasurement.start) < threshold) {
                    return { point: baseMeasurement.start, type: 'base', index: -1 };
                }
                if (calculateDistance({x, y}, baseMeasurement.end) < threshold) {
                    return { point: baseMeasurement.end, type: 'base', index: -1 };
                }
            }

            for (let i = 0; i < measurements.length; i++) {
                const m = measurements[i];
                if (calculateDistance({x, y}, m.start) < threshold) {
                    return { point: m.start, type: 'measurement', index: i };
                }
                if (calculateDistance({x, y}, m.end) < threshold) {
                    return { point: m.end, type: 'measurement', index: i };
                }
            }

            return null;
        }

        function getCanvasCoords(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            return { x, y };
        }

        canvas.addEventListener('mousemove', (e) => {
            if (!image) return;

            const { x, y } = getCanvasCoords(e);

            if (isDrawing && startPoint) {
                tempLine = { start: startPoint, end: { x, y } };
                redraw();
            } else {
                const node = findNearNode(x, y);
                if (node !== hoveredNode) {
                    hoveredNode = node;
                    redraw();
                }
            }
        });

        canvas.addEventListener('mousedown', (e) => {
            if (!image) return;

            const { x, y } = getCanvasCoords(e);

            const node = findNearNode(x, y);

            if (node) {
                clickedNode = node;
                isDrawing = true;
                startPoint = { x: node.point.x, y: node.point.y };
            } else {
                isDrawing = true;
                startPoint = { x, y };
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            if (!image || !isDrawing || !startPoint) return;

            const { x, y } = getCanvasCoords(e);

            const endPoint = { x, y };
            const length = calculateDistance(startPoint, endPoint);

            if (length < 5) {
                isDrawing = false;
                startPoint = null;
                clickedNode = null;
                tempLine = null;
                redraw();
                return;
            }

            saveHistory();

            if (!baseMeasurement) {
                baseMeasurement = {
                    start: { ...startPoint },
                    end: { ...endPoint },
                    length: length,
                    type: selectedTool,
                    displayValue: 1
                };
                setStatus('Base set. Draw shapes to measure');
            } else {
                const ratio = calculateRatio(length, baseMeasurement.length, baseMeasurement.type);
                measurements.push({
                    start: { ...startPoint },
                    end: { ...endPoint },
                    length: length,
                    ratio: ratio,
                    type: selectedTool
                });
            }

            isDrawing = false;
            startPoint = null;
            clickedNode = null;
            tempLine = null;
            updateUI();
            redraw();
        });

        function calculateDistance(p1, p2) {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        function calculateRatio(length, baseLength, baseType) {
            return length / baseLength;
        }

        function saveHistory() {
            history.push({
                baseMeasurement: baseMeasurement ? JSON.parse(JSON.stringify(baseMeasurement)) : null,
                measurements: JSON.parse(JSON.stringify(measurements))
            });
            if (history.length > 50) history.shift();
        }

        function redraw() {
            if (!image) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0);

            if (baseMeasurement) {
                drawShape(baseMeasurement, '#f44336', false);
            }

            measurements.forEach((m) => {
                drawShape(m, '#2196f3', false);
            });

            if (tempLine) {
                const color = !baseMeasurement ? '#f44336' : '#2196f3';
                const currentShape = {
                    start: tempLine.start,
                    end: tempLine.end,
                    type: selectedTool
                };

                drawShape(currentShape, color, true);

                if (baseMeasurement) {
                    const length = calculateDistance(tempLine.start, tempLine.end);
                    const ratio = calculateRatio(length, baseMeasurement.length, baseMeasurement.type);
                    const decimals = parseInt(decimalPlaces.value);
                    const midX = (tempLine.start.x + tempLine.end.x) / 2;
                    const midY = (tempLine.start.y + tempLine.end.y) / 2;

                    ctx.fillStyle = color;
                    ctx.font = '600 13px -apple-system, sans-serif';
                    const text = ratio.toFixed(decimals);
                    const textWidth = ctx.measureText(text).width;
                    ctx.fillRect(midX - textWidth / 2 - 6, midY - 18, textWidth + 12, 20);
                    ctx.fillStyle = 'white';
                    ctx.fillText(text, midX - textWidth / 2, midY - 4);
                }
            }

            if (hoveredNode && !isDrawing) {
                drawNode(hoveredNode.point, hoveredNode.type === 'base' ? '#f44336' : '#2196f3', true);
            }
        }

        function drawShape(shape, color, isDashed = false) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash(isDashed ? [5, 5] : []);

            if (shape.type === 'line') {
                ctx.beginPath();
                ctx.moveTo(shape.start.x, shape.start.y);
                ctx.lineTo(shape.end.x, shape.end.y);
                ctx.stroke();
            } else if (shape.type === 'circle-radius') {
                const radius = calculateDistance(shape.start, shape.end);
                ctx.beginPath();
                ctx.arc(shape.start.x, shape.start.y, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(shape.start.x, shape.start.y);
                ctx.lineTo(shape.end.x, shape.end.y);
                ctx.stroke();
            } else if (shape.type === 'circle-diameter') {
                const centerX = (shape.start.x + shape.end.x) / 2;
                const centerY = (shape.start.y + shape.end.y) / 2;
                const radius = calculateDistance(shape.start, shape.end) / 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(shape.start.x, shape.start.y);
                ctx.lineTo(shape.end.x, shape.end.y);
                ctx.stroke();
            }

            drawNode(shape.start, color);
            drawNode(shape.end, color);
        }

        function drawNode(point, color, highlight = false) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, highlight ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();
            if (highlight) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        function updateUI() {
            undoBtn.disabled = history.length === 0;
            clearBtn.disabled = !baseMeasurement && measurements.length === 0;

            measurementList.innerHTML = '';

            if (!baseMeasurement && measurements.length === 0) {
                measurementList.innerHTML = '<div class="empty-state">No measurements yet</div>';
                return;
            }

            const decimals = parseInt(decimalPlaces.value);

            if (baseMeasurement) {
                const item = document.createElement('div');
                item.className = 'measurement-item base';
                let typeText = baseMeasurement.type === 'line' ? 'Line' :
                              baseMeasurement.type === 'circle-radius' ? 'Circle R' : 'Circle D';
                item.innerHTML = `
                    <span class="setting-label">Base (${typeText})</span>
                    <span class="measurement-value">1.00</span>
                `;
                measurementList.appendChild(item);
            }

            measurements.forEach((m, i) => {
                const item = document.createElement('div');
                item.className = 'measurement-item';
                let typeText = m.type === 'line' ? 'Line' :
                              m.type === 'circle-radius' ? 'Circle R' : 'Circle D';
                item.innerHTML = `
                    <span class="setting-label">#${i + 1} (${typeText})</span>
                    <div>
                        <span class="measurement-value">${m.ratio.toFixed(decimals)}</span>
                        <button class="measurement-delete" onclick="deleteMeasurement(${i})">×</button>
                    </div>
                `;
                measurementList.appendChild(item);
            });
        }

        window.deleteMeasurement = function(index) {
            saveHistory();
            measurements.splice(index, 1);
            updateUI();
            redraw();
        };

        function setStatus(message) {
            statusBar.textContent = message;
        }

        decimalPlaces.addEventListener('input', () => {
            updateUI();
        });

        updateUI();
