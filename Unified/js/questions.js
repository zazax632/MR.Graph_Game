const questionGenerator = {
    rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    shuffle(arr) { return arr.sort(() => Math.random() - 0.5); },

    generate(mode, difficulty = 1) {
        switch (mode) {
            case 1: return this.genTrueFalse(difficulty);
            case 2: return this.genMatching(difficulty);
            case 3: return this.genSpeed(difficulty);
            case 4: return this.genGraph(difficulty);
            case 5: return this.genFillBlank(difficulty);
            case 6: return this.genBoss(difficulty);
            default: return this.genTrueFalse(difficulty);
        }
    },

    genTrueFalse(diff) {
        const isFunc = Math.random() > 0.5;
        let type = Math.random() > 0.5 ? 'mapping' : 'set';
        let data, hint;

        if (type === 'mapping') {
            const domain = [1, 2, 3, 4];
            let pairs = [];
            if (isFunc) {
                domain.forEach(d => pairs.push([d, this.rand(1, 10)]));
                hint = "สมาชิกตัวหน้า (Domain) ทุกตัว จับคู่กับตัวหลังเพียงตัวเดียว";
            } else {
                domain.forEach(d => pairs.push([d, this.rand(1, 10)]));
                pairs.push([domain[0], this.rand(11, 20)]);
                hint = `สมาชิกตัวหน้า ${domain[0]} จับคู่กับตัวหลังหลายตัว ไม่ใช่ฟังก์ชัน`;
            }
            data = { domain, pairs: this.shuffle(pairs) };
        } else {
            let pairs = [];
            if (isFunc) {
                let usedX = new Set();
                while (pairs.length < 4) {
                    let x = this.rand(1, 10);
                    if (!usedX.has(x)) {
                        pairs.push(`(${x}, ${this.rand(1, 20)})`);
                        usedX.add(x);
                    }
                }
                hint = "ไม่มีคู่อันดับใดที่มีสมาชิกตัวหน้าซ้ำกัน";
            } else {
                let x = this.rand(1, 5);
                pairs.push(`(${x}, ${this.rand(1, 10)})`);
                pairs.push(`(${x}, ${this.rand(11, 20)})`);
                pairs.push(`(${x + 1}, ${this.rand(1, 10)})`);
                hint = `มีคู่อันดับที่มีตัวหน้าเป็น ${x} ซ้ำกัน`;
            }
            data = `{ ${this.shuffle(pairs).join(', ')} }`;
        }
        return { type: 'true_false', display: type, data: data, answer: isFunc, instruction: "ความสัมพันธ์นี้เป็นฟังก์ชันหรือไม่?", hint: hint };
    },

    genMatching(diff) {
        const m = this.rand(1, 5) * (Math.random() > 0.5 ? 1 : -1);
        const c = this.rand(-5, 5);
        const funcStr = `f(x) = ${m}x ${c >= 0 ? '+ ' + c : c}`;
        let pairs = [];
        let usedX = new Set();
        while (pairs.length < 4) {
            let x = this.rand(-5, 5);
            if (!usedX.has(x)) {
                usedX.add(x);
                pairs.push({ val: x, match: `r${pairs.length}`, y: (m * x) + c });
            }
        }
        return {
            type: 'matching',
            instruction: "จับคู่โดเมน (x) และเรนจ์ (y) ให้ถูกต้อง",
            funcStr: funcStr,
            pairs: pairs,
            answer: true,
            hint: `แทนค่า x ลงใน ${funcStr}`
        };
    },

    genSpeed(diff) {
        const m = this.rand(2, 5);
        const c = this.rand(1, 9);
        const x = this.rand(1, 10);
        const ans = (m * x) + c;
        return { type: 'input', instruction: "คำนวณค่าฟังก์ชัน (Speed Required)", funcStr: `f(x) = ${m}x + ${c}`, query: `f(${x})`, answer: ans, hint: "คิดเลขให้ไว!" };
    },

    genGraph(diff) {
        const isLinear = Math.random() > 0.3;
        let params, label, ans, qX;
        if (isLinear) {
            const m = this.rand(-2, 2) || 1;
            const c = this.rand(-3, 3);
            qX = this.rand(-2, 2);
            ans = (m * qX) + c;
            label = `f(x) = ${m === 1 ? '' : (m === -1 ? '-' : m)}x ${c === 0 ? '' : (c > 0 ? '+ ' + c : c)}`;
            params = { type: 'linear', m, c };
        } else {
            const a = this.pick([1, -1, 0.5]);
            const c = this.rand(-4, 4);
            qX = this.rand(-2, 2);
            ans = (a * qX * qX) + c;
            label = `f(x) = ${a}x² ${c === 0 ? '' : (c > 0 ? '+ ' + c : c)}`;
            params = { type: 'parabola', a, c };
        }
        let options = new Set([ans]);
        while (options.size < 4) options.add(ans + this.rand(-5, 5) || ans + 1);
        return { type: 'graph', instruction: "วิเคราะห์ค่าจากกราฟ", params, queryX: qX, answer: ans, options: Array.from(options).sort(() => Math.random() - 0.5), label, hint: `ดูที่แกน X = ${qX} แล้วหาจุดบนกราฟ` };
    },

    genFillBlank(diff) {
        const m = this.rand(2, 4);
        const c = this.rand(-2, 2);
        let rows = [];
        let missingIdx = this.rand(0, 2);
        let ans;
        for (let i = 0; i < 3; i++) {
            let x = i + 1;
            let y = (m * x) + c;
            if (i === missingIdx) { rows.push({ x: x, y: '?' }); ans = y; } else { rows.push({ x: x, y: y }); }
        }
        return {
            type: 'fill_blank',
            instruction: "เติมค่า y ที่หายไปในตารางให้สัมพันธ์กับ x",
            funcStr: `f(x) = ${m}x ${c >= 0 ? '+ ' + c : c}`,
            rows: rows,
            answer: ans,
            hint: `แทนค่า x=${missingIdx + 1} ลงในสมการข้างบน`
        };
    },

    genBoss(diff) {
        const mode = this.pick([3, 4, 5]);
        const q = this.generate(mode, 2);
        q.isBoss = true;
        return q;
    }
};
