const lab = {
    init() {
        const container = document.getElementById('lab-container');
        container.innerHTML = `
            <div class="lab-controls" style="margin-bottom: 20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <label>f(x) = </label>
                    <input type="text" id="lab-function-input" value="x^2" style="flex: 1; text-align: left;">
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-cyber" id="lab-plot-btn" style="flex: 1;">Draw Graph</button>
                </div>
                <div id="lab-error-msg" style="color: #ff0055; font-size: 0.8rem; margin-top: 5px;"></div>
            </div>
            
            <div id="lab-graph-target" style="width: 100%; height: 400px; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,242,255,0.2); margin-bottom: 20px;"></div>
            
            <div class="lab-info" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                <div class="glass-panel" style="padding: 15px;">
                    <h3 style="font-size: 0.9rem; color: var(--primary);">Domain</h3>
                    <p id="lab-domain-display" style="font-size: 0.8rem;">-</p>
                </div>
                <div class="glass-panel" style="padding: 15px;">
                    <h3 style="font-size: 0.9rem; color: var(--primary);">Range</h3>
                    <p id="lab-range-display" style="font-size: 0.8rem;">-</p>
                </div>
                <div class="glass-panel" style="padding: 15px;">
                    <h3 style="font-size: 0.9rem; color: var(--primary);">Behavior</h3>
                    <p id="lab-behavior-display" style="font-size: 0.8rem;">-</p>
                </div>
            </div>

            <div class="glass-panel" style="padding: 15px; overflow-x: auto;">
                <h3 style="font-size: 1rem; color: var(--primary); margin-bottom: 10px;">Table of Values</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; text-align: center;">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(0,242,255,0.3);">
                            <th style="padding: 8px;">x</th>
                            <th style="padding: 8px;">f(x)</th>
                        </tr>
                    </thead>
                    <tbody id="lab-table-body">
                        <!-- Points will be injected here -->
                    </tbody>
                </table>
            </div>
        `;

        this.input = document.getElementById('lab-function-input');
        this.plotBtn = document.getElementById('lab-plot-btn');
        this.errorMsg = document.getElementById('lab-error-msg');
        this.target = '#lab-graph-target';

        this.plotBtn.addEventListener('click', () => this.plot());
        this.input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.plot(); });

        this.plot(); // Initial plot
    },

    plot() {
        let expression = this.input.value.trim();
        const targetEl = document.querySelector(this.target);
        if (!targetEl) return;

        this.errorMsg.textContent = '';

        if (!expression) {
            this.errorMsg.textContent = 'กรุณาป้อนสมการ';
            return;
        }

        const width = targetEl.clientWidth;
        const height = targetEl.clientHeight;

        let plotData = [{
            fn: expression,
            color: '#00f2ff',
            graphType: 'polyline'
        }];

        try {
            functionPlot({
                target: this.target,
                width: width,
                height: height,
                yAxis: { domain: [-10, 10] },
                xAxis: { domain: [-10, 10] },
                grid: true,
                data: plotData
            });
            this.analyze(expression);
            this.generateTable(expression, []);
        } catch (e) {
            console.error("Graph Error:", e);
            this.errorMsg.textContent = "รูปแบบสมการไม่ถูกต้อง";
            document.getElementById('lab-domain-display').textContent = "-";
            document.getElementById('lab-range-display').textContent = "-";
            document.getElementById('lab-behavior-display').textContent = "-";
        }
    },

    analyze(expr) {
        const cleanExpr = expr.replace(/\s+/g, '').toLowerCase();
        let domainText = "จำนวนจริงทั้งหมด (R)";
        let rangeText = "ไม่สามารถระบุได้ชัดเจน";

        try {
            const compiled = math.compile(expr);
            const checkPoint = (x) => {
                try {
                    const y = compiled.evaluate({ x: x });
                    if (typeof y === 'number' && isFinite(y) && !isNaN(y)) return true;
                    if (typeof y === 'object' && 're' in y && 'im' in y) return Math.abs(y.im) < 1e-10;
                    return false;
                } catch (e) { return false; }
            };

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
                } else { allValid = false; }
            }

            if (allValid && hasZero) domainText = "จำนวนจริงทั้งหมด (R)";
            else if (!hasNegative && hasPositive) domainText = hasZero ? "x ≥ 0" : "x > 0";
            else if (hasNegative && !hasPositive) domainText = hasZero ? "x ≤ 0" : "x < 0";
            else if (allValid && !hasZero) domainText = "จำนวนจริงทั้งหมด ยกเว้น 0 (x ≠ 0)";
            else {
                if (cleanExpr.includes('sqrt')) domainText = "ค่าภายในรากต้อง ≥ 0";
                else if (cleanExpr.includes('log') || cleanExpr.includes('ln')) domainText = "ค่าภายใน log ต้อง > 0";
                else if (cleanExpr.includes('/x')) domainText = "ตัวส่วนต้องไม่เป็น 0";
                else domainText = "ตรวจสอบกราฟ (มีข้อจำกัดบางช่วง)";
            }

            let yValues = [];
            for (let x = -20; x <= 20; x += 0.2) {
                try {
                    const y = compiled.evaluate({ x: x });
                    if (typeof y === 'number' && isFinite(y)) yValues.push(y);
                } catch (e) { }
            }

            if (yValues.length > 0) {
                const minY = Math.min(...yValues);
                const maxY = Math.max(...yValues);
                const round = (n) => parseFloat(n.toFixed(2));

                if (Math.abs(maxY - minY) < 0.001) {
                    rangeText = `y = ${round(minY)}`;
                } else {
                    const isMinBounded = minY > -500;
                    const isMaxBounded = maxY < 500;
                    if (!isMinBounded && !isMaxBounded) rangeText = "จำนวนจริงทั้งหมด (R)";
                    else if (isMinBounded && !isMaxBounded) rangeText = `y ≥ ${round(minY)}`;
                    else if (!isMinBounded && isMaxBounded) rangeText = `y ≤ ${round(maxY)}`;
                    else rangeText = `${round(minY)} ≤ y ≤ ${round(maxY)}`;

                    if (['sin(x)', 'cos(x)'].includes(cleanExpr)) rangeText = "-1 ≤ y ≤ 1";
                    if (cleanExpr === 'x^2') rangeText = "y ≥ 0";
                }
            }
        } catch (e) {
            domainText = "ไม่สามารถคำนวณได้";
            rangeText = "-";
        }

        document.getElementById('lab-domain-display').textContent = domainText;
        document.getElementById('lab-range-display').textContent = rangeText;
        this.analyzeBehavior(cleanExpr);
    },

    analyzeBehavior(cleanExpr) {
        let behavior = "ผสม (มีทั้งเพิ่มและลด)";
        const patterns = {
            inc: [/^x$/, /^x\^3$/, /^e\^x$/, /^ln\(x\)$/, /^sqrt\(x\)$/],
            dec: [/^-x$/, /^-x\^3$/, /^e\^x$/, /^-ln\(x\)$/]
        };

        if (cleanExpr === '1/x') behavior = "ฟังก์ชันลด (ในแต่ละช่วง)";
        else if (cleanExpr === '-1/x') behavior = "ฟังก์ชันเพิ่ม (ในแต่ละช่วง)";
        else if (!isNaN(parseFloat(cleanExpr)) && isFinite(cleanExpr)) behavior = "ฟังก์ชันคงที่ (Constant)";
        else {
            for (let p of patterns.inc) if (p.test(cleanExpr)) behavior = "ฟังก์ชันเพิ่มตลอดช่วง";
            for (let p of patterns.dec) if (p.test(cleanExpr)) behavior = "ฟังก์ชันลดตลอดช่วง";
        }
        document.getElementById('lab-behavior-display').textContent = behavior;
    },

    generateTable(expr, extraPoints) {
        const body = document.getElementById('lab-table-body');
        body.innerHTML = '';
        try {
            const compiled = math.compile(expr);
            let points = [];
            for (let x = -5; x <= 5; x++) points.push({ x: x });
            extraPoints.forEach(p => {
                if (p.type === 'x' && !points.some(pt => Math.abs(pt.x - p.val) < 0.001)) {
                    points.push({ x: p.val, highlight: true });
                }
            });
            points.sort((a, b) => a.x - b.x);

            points.forEach(pt => {
                const tr = document.createElement('tr');
                if (pt.highlight) tr.style.backgroundColor = 'rgba(0, 242, 255, 0.1)';
                tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

                let yVal;
                try {
                    const res = compiled.evaluate({ x: pt.x });
                    yVal = typeof res === 'number' ? parseFloat(res.toFixed(4)) : res;
                } catch (e) { yVal = "Error"; }

                tr.innerHTML = `<td style="padding: 5px;">${pt.x}</td><td style="padding: 5px;">${yVal}</td>`;
                body.appendChild(tr);
            });
        } catch (e) {
            body.innerHTML = '<tr><td colspan="2">ไม่สามารถสร้างตารางได้</td></tr>';
        }
    }
};
