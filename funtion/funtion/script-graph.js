document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('function-input');
    const conditionInput = document.getElementById('condition-input');
    const plotBtn = document.getElementById('plot-btn');
    const domainDisplay = document.getElementById('domain-display');
    const rangeDisplay = document.getElementById('range-display');
    const errorMsg = document.getElementById('error-msg');

    // Initial plot
    plotGraph(input.value, conditionInput.value);

    plotBtn.addEventListener('click', () => {
        plotGraph(input.value, conditionInput.value);
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            plotGraph(input.value, conditionInput.value);
        }
    });

    conditionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            plotGraph(input.value, conditionInput.value);
        }
    });

    function plotGraph(expression, conditions) {
        errorMsg.textContent = '';

        try {
            // Basic validation
            if (!expression.trim()) {
                throw new Error("กรุณาป้อนสมการ");
            }

            const width = document.getElementById('graph-target').clientWidth;
            const height = document.getElementById('graph-target').clientHeight;

            // Prepare data array for function-plot
            let plotData = [{
                fn: expression,
                color: '#3b82f6',
                graphType: 'polyline'
            }];

            // Parse extra conditions (x=..., y=...)
            let extraPoints = [];
            if (conditions && conditions.trim()) {
                const parts = conditions.split(',').map(s => s.trim());
                parts.forEach(part => {
                    // Check for x=...
                    const xMatch = part.match(/^x\s*=\s*(-?\d+(\.\d+)?)$/i);
                    if (xMatch) {
                        const val = parseFloat(xMatch[1]);
                        plotData.push({
                            fnType: 'parametric',
                            graphType: 'polyline',
                            x: {
                                scaling: { type: 'linear', domain: [val, val] }
                            },
                            y: {
                                scaling: { type: 'linear', domain: [-10, 10] } // spanning somewhat
                            },
                            fn: (scope) => {
                                return {
                                    x: val,
                                    y: scope.t
                                }
                            },
                            range: [-20, 20], // t range
                            color: '#ef4444',
                            attr: { "stroke-dasharray": "5,5" }
                        });
                        extraPoints.push({ type: 'x', val: val });
                    }

                    // Check for y=...
                    const yMatch = part.match(/^y\s*=\s*(-?\d+(\.\d+)?)$/i);
                    if (yMatch) {
                        const val = parseFloat(yMatch[1]);
                        plotData.push({
                            fn: val.toString(),
                            color: '#22c55e',
                            graphType: 'polyline',
                            attr: { "stroke-dasharray": "5,5" }
                        });
                        extraPoints.push({ type: 'y', val: val });
                    }
                });
            }

            functionPlot({
                target: '#graph-target',
                width: width,
                height: height,
                yAxis: { domain: [-10, 10] },
                xAxis: { domain: [-10, 10] },
                grid: true,
                data: plotData
            });

            analyzeFunction(expression);
            generateTable(expression, extraPoints);

        } catch (err) {
            console.error(err);
            errorMsg.textContent = "รูปแบบสมการไม่ถูกต้อง ลองพิมพ์เช่น 'x^2' หรือ 'sin(x)'";
            // Clear info if invalid
            domainDisplay.textContent = "-";
            rangeDisplay.textContent = "-";
        }
    }

    function analyzeFunction(expr) {
        // Advanced Numerical Analysis

        const cleanExpr = expr.replace(/\s+/g, '').toLowerCase();
        let domainText = "จำนวนจริงทั้งหมด (R)";
        let rangeText = "ไม่สามารถระบุได้ชัดเจน";

        try {
            const compiled = math.compile(expr);

            // 1. Domain Scanning
            // Check sample points from -100 to 100
            let validPoints = [];
            let invalidPoints = [];

            // Check negative large
            const checkPoint = (x) => {
                try {
                    const y = compiled.evaluate({ x: x });
                    // Check if y is a valid finite real number
                    if (typeof y === 'number' && isFinite(y) && !isNaN(y)) return true;
                    // Check complex number from mathjs
                    if (typeof y === 'object' && 're' in y && 'im' in y) {
                        return Math.abs(y.im) < 1e-10; // Treat effectively real as real
                    }
                    return false;
                } catch (e) {
                    return false;
                }
            };

            // Scan widely to detect general domain shape
            const scanRange = [-100, -50, -10, -5, -2, -1, -0.5, 0, 0.5, 1, 2, 5, 10, 50, 100];
            let allValid = true;
            let noneValid = true;
            let hasPositive = false;
            let hasNegative = false;
            let hasZero = checkPoint(0);

            for (let x of scanRange) {
                if (x === 0) continue;
                if (checkPoint(x)) {
                    noneValid = false;
                    if (x > 0) hasPositive = true;
                    if (x < 0) hasNegative = true;
                } else {
                    allValid = false;
                }
            }

            // Logic inference based on sample scan
            if (allValid && hasZero) {
                domainText = "จำนวนจริงทั้งหมด (R)";
            } else if (!hasNegative && hasPositive) {
                // Check closer to 0
                if (hasZero) domainText = "x ≥ 0";
                else domainText = "x > 0";
            } else if (hasNegative && !hasPositive) {
                if (hasZero) domainText = "x ≤ 0";
                else domainText = "x < 0";
            } else if (allValid && !hasZero) { // only 0 failed
                domainText = "จำนวนจริงทั้งหมด ยกเว้น 0 (x ≠ 0)";
            } else {
                // Mixed or complex domain
                // Fallback to specific known patterns for better text
                if (cleanExpr.includes('sqrt')) domainText = "ค่าภายในรากต้อง ≥ 0";
                else if (cleanExpr.includes('log') || cleanExpr.includes('ln')) domainText = "ค่าภายใน log ต้อง > 0";
                else if (cleanExpr.includes('/x')) domainText = "ตัวส่วนต้องไม่เป็น 0";
                else domainText = "ตรวจสอบกราฟ (มีข้อจำกัดบางช่วง)";
            }

            // 2. Range Scanning
            // Use a denser scan for range estimation on valid domain parts
            let yValues = [];
            for (let x = -20; x <= 20; x += 0.2) {
                try {
                    const y = compiled.evaluate({ x: x });
                    if (typeof y === 'number' && isFinite(y)) {
                        yValues.push(y);
                    }
                } catch (e) { }
            }

            if (yValues.length > 0) {
                const minY = Math.min(...yValues);
                const maxY = Math.max(...yValues);

                // Heuristic check for infinity
                // If max is close to boundaries of scan, it might be infinite
                // But for display, we show local min/max or general set

                let rangeParts = [];
                // Round for display
                const round = (n) => parseFloat(n.toFixed(2));

                // Detect constant
                if (Math.abs(maxY - minY) < 0.001) {
                    rangeText = `y = ${round(minY)}`;
                } else {
                    // Check if it seems bounded
                    const isMinBounded = minY > -500; // arbitrary large threshold logic
                    const isMaxBounded = maxY < 500;

                    if (!isMinBounded && !isMaxBounded) {
                        rangeText = "จำนวนจริงทั้งหมด (R)";
                    } else if (isMinBounded && !isMaxBounded) {
                        // Check if min is close to an integer
                        let cleanMin = Math.round(minY);
                        if (Math.abs(minY - cleanMin) < 0.1) rangeText = `y ≥ ${cleanMin}`;
                        else rangeText = `y ≥ ${round(minY)}`;
                    } else if (!isMinBounded && isMaxBounded) {
                        let cleanMax = Math.round(maxY);
                        if (Math.abs(maxY - cleanMax) < 0.1) rangeText = `y ≤ ${cleanMax}`;
                        else rangeText = `y ≤ ${round(maxY)}`;
                    } else {
                        rangeText = `${round(minY)} ≤ y ≤ ${round(maxY)}`;
                    }

                    // Special Override for known periodic functions like sin/cos
                    if (['sin(x)', 'cos(x)'].includes(cleanExpr)) {
                        rangeText = "-1 ≤ y ≤ 1";
                    }
                    if (cleanExpr === 'x^2') { // explicit simple cases override
                        rangeText = "y ≥ 0";
                    }
                }
            }

        } catch (e) {
            console.error(e);
            domainText = "ไม่สามารถคำนวณได้";
            rangeText = "-";
        }

        document.getElementById('domain-display').textContent = domainText;
        document.getElementById('range-display').textContent = rangeText;

        // Analyze behavior (Increasing/Decreasing)
        analyzeBehavior(cleanExpr);
    }

    function analyzeBehavior(cleanExpr) {
        const behaviorDisplay = document.getElementById('behavior-display');
        let behavior = "ผสม (มีทั้งเพิ่มและลด)"; // Default for complex functions like x^2, sin(x)

        // Strictly Increasing
        // x, x^3, e^x, ln(x), x+c, 2x, etc.
        // Heuristic: check specific known patterns
        const increasingPatterns = [
            /^x$/,             // x
            /^x\^3$/,          // x^3
            /^x\^5$/,          // x^5 (odd powers)
            /^e\^x$/,          // e^x
            /^exp\(x\)$/,
            /^ln\(x\)$/,       // ln(x)
            /^log\(x\)$/,
            /^sqrt\(x\)$/,     // sqrt(x)
            /^x\^0\.5$/
        ];

        // Strictly Decreasing
        // -x, -x^3, e^-x, 1/x (in intervals), -ln(x)
        const decreasingPatterns = [
            /^-x$/,            // -x
            /^-x\^3$/,         // -x^3
            /^e\^-x$/,         // e^-x
            /^-ln\(x\)$/       // -ln(x)
        ];

        // Check for 1/x separately as it's decreasing in intervals but undefined at 0
        if (cleanExpr === '1/x' || cleanExpr === 'x^-1') {
            behavior = "ฟังก์ชันลด (ในแต่ละช่วงของโดเมน)";
            behaviorDisplay.textContent = behavior;
            return;
        }

        if (cleanExpr === '-1/x') {
            behavior = "ฟังก์ชันเพิ่ม (ในแต่ละช่วงของโดเมน)";
            behaviorDisplay.textContent = behavior;
            return;
        }

        // Check strictly increasing
        for (let pattern of increasingPatterns) {
            if (pattern.test(cleanExpr)) {
                behavior = "ฟังก์ชันเพิ่มตลอดช่วง (Strictly Increasing)";
                behaviorDisplay.textContent = behavior;
                return;
            }
        }

        // Check strictly decreasing
        for (let pattern of decreasingPatterns) {
            if (pattern.test(cleanExpr)) {
                behavior = "ฟังก์ชันลดตลอดช่วง (Strictly Decreasing)";
                behaviorDisplay.textContent = behavior;
                return;
            }
        }

        // Handle constant functions e.g. '5'
        if (!isNaN(parseFloat(cleanExpr)) && isFinite(cleanExpr)) {
            behavior = "ฟังก์ชันคงที่ (Constant)";
            behaviorDisplay.textContent = behavior;
            return;
        }

        behaviorDisplay.textContent = behavior;
    }

    function generateTable(expression, extraPoints) {
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = ''; // Clear previous

        // Normalize expression for mathjs
        // function-plot handles some syntax differently, but mathjs is robust.
        // We might need to handle 'ln' vs 'log' or replacements depending on input complexity.

        try {
            const compiled = math.compile(expression);

            // Generate points: -5 to 5 integer steps, plus any extra specific x-points
            let points = [];
            for (let x = -5; x <= 5; x++) {
                points.push({ x: x, type: 'standard' });
            }

            // Add extra X points if any
            extraPoints.forEach(p => {
                if (p.type === 'x') {
                    // Check if already exists to avoid duplicates
                    if (!points.some(pt => Math.abs(pt.x - p.val) < 0.001)) {
                        points.push({ x: p.val, type: 'highlight' });
                    } else {
                        // Mark existing as highlight
                        const existing = points.find(pt => Math.abs(pt.x - p.val) < 0.001);
                        existing.type = 'highlight';
                    }
                }
            });

            // Sort points by x value
            points.sort((a, b) => a.x - b.x);

            // Generate rows
            points.forEach(pt => {
                const tr = document.createElement('tr');
                if (pt.type === 'highlight') {
                    tr.classList.add('highlight-row');
                }

                const tdX = document.createElement('td');
                tdX.textContent = pt.x;

                const tdY = document.createElement('td');
                try {
                    let yVal = compiled.evaluate({ x: pt.x });
                    // Format yVal
                    if (typeof yVal === 'number') {
                        yVal = parseFloat(yVal.toFixed(4)); // limit decimals
                    }
                    tdY.textContent = yVal;
                } catch (e) {
                    tdY.textContent = "Undefined / Error";
                }

                tr.appendChild(tdX);
                tr.appendChild(tdY);
                tableBody.appendChild(tr);
            });

        } catch (err) {
            console.error("Table generation error:", err);
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 2;
            td.textContent = "ไม่สามารถสร้างตารางได้ (สมการซับซ้อนเกินไป)";
            td.style.color = 'var(--error-color)';
            tr.appendChild(td);
            tableBody.appendChild(tr);
        }
    }
});
