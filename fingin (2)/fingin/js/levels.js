const levels = {
    // Level 1: Function Identification (Table/Mapping)
    level1: {
        title: "Function or Not?",
        instruction: "ความสัมพันธ์นี้เป็นฟังก์ชันหรือไม่?",
        questions: [
            {
                type: 'mapping',
                data: { domain: [1, 2, 3], range: ['A', 'B', 'C'], pairs: [[1, 'A'], [2, 'B'], [3, 'C']] }, // 1-1
                isFunction: true,
                hint: "สมาชิกตัวหน้าจับคู่กับตัวหลังเพียงตัวเดียว"
            },
            {
                type: 'mapping',
                data: { domain: [1, 2, 3], range: ['A', 'B'], pairs: [[1, 'A'], [2, 'A'], [3, 'B']] }, // Many-1
                isFunction: true,
                hint: "โดเมนหนึ่งตัวจับคู่เรนจ์หนึ่งตัว (แม้เรนจ์จะซ้ำกัน)"
            },
            {
                type: 'mapping',
                data: { domain: [1, 2], range: ['A', 'B', 'C'], pairs: [[1, 'A'], [1, 'B'], [2, 'C']] }, // 1-Many
                isFunction: false,
                hint: "มีโดเมน (1) จับคู่กับเรนจ์มากกว่าหนึ่งตัว"
            },
            {
                type: 'pairs',
                data: "{(1,2), (2,4), (3,6), (4,8)}",
                isFunction: true,
                hint: "ไม่มีสมาชิกตัวหน้าซ้ำกันเลย"
            },
            {
                type: 'pairs',
                data: "{(1,5), (2,5), (3,5)}",
                isFunction: true,
                hint: "ตัวหน้าไม่ซ้ำ ตัวหลังซ้ำได้"
            },
            {
                type: 'pairs',
                data: "{(1,2), (1,3), (2,4)}",
                isFunction: false,
                hint: "ตัวหน้า (1) ซ้ำกัน จับคู่กับ 2 และ 3"
            }
        ]
    },

    // Level 2: Domain Range Matching
    level2: {
        title: "Domain & Range Match",
        instruction: "จับคู่โดเมน (x) กับค่าเรนจ์ (y) ที่ถูกต้องจากสมการ f(x) = 2x + 1",
        // Dynamic generation will be used in main logic, or simpler static sets here
        sets: [
            { func: "f(x) = x + 1", pairs: [{ x: 1, y: 2 }, { x: 5, y: 6 }, { x: -1, y: 0 }, { x: 10, y: 11 }] },
            { func: "f(x) = 2x", pairs: [{ x: 2, y: 4 }, { x: 3, y: 6 }, { x: 0, y: 0 }, { x: -2, y: -4 }] },
            { func: "f(x) = x²", pairs: [{ x: 2, y: 4 }, { x: -2, y: 4 }, { x: 3, y: 9 }, { x: 1, y: 1 }] }
        ]
    },

    // Level 3: Reading Graphs
    level3: {
        title: "Reading Graphs",
        instruction: "จงหาค่าของ f(x) จากกราฟที่กำหนด",
        questions: [
            // Linear
            { type: 'linear', m: 1, c: 0, queryX: 2, answer: 2, label: "f(x) = x" },
            { type: 'linear', m: 2, c: 1, queryX: 1, answer: 3, label: "f(x) = 2x + 1" },
            { type: 'linear', m: -1, c: 3, queryX: 2, answer: 1, label: "f(x) = -x + 3" },
            // Parabola
            { type: 'parabola', a: 1, b: 0, c: 0, queryX: 2, answer: 4, label: "f(x) = x²" },
            { type: 'parabola', a: 1, b: 0, c: -2, queryX: 3, answer: 7, label: "f(x) = x² - 2" }
        ]
    },

    // Level 4: Calculate Function
    level4: {
        title: "Calculate f(x)",
        instruction: "คำนวณหาค่าของฟังก์ชัน",
        questions: [
            { funcStr: "f(x) = 3x - 5", x: 4, answer: 7 },
            { funcStr: "f(x) = 5x + 2", x: -1, answer: -3 },
            { funcStr: "f(x) = x² + 2x", x: 3, answer: 15 },
            { funcStr: "f(x) = 2(x + 1)", x: 5, answer: 12 },
            { funcStr: "f(x) = 10 - x", x: 7, answer: 3 }
        ]
    }
};

// Helper to draw graphs for Level 3
function drawGraph(canvas, type, params, highlightX) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 20; // pixels per unit

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    for (let i = 0; i <= width; i += scale) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height); ctx.stroke(); // Y
    ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); ctx.stroke(); // X

    // Function plot
    ctx.strokeStyle = '#4e54c8';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let px = 0; px < width; px++) {
        const x = (px - centerX) / scale;
        let y;
        if (type === 'linear') {
            y = params.m * x + params.c;
        } else if (type === 'parabola') {
            y = params.a * x * x + params.b * x + params.c;
        }

        const py = centerY - (y * scale);
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Highlight Query Point
    if (highlightX !== undefined) {
        let yResult;
        if (type === 'linear') {
            yResult = params.m * highlightX + params.c;
        } else if (type === 'parabola') {
            yResult = params.a * highlightX * highlightX + params.b * highlightX + params.c;
        }

        const px = centerX + (highlightX * scale);
        const py = centerY - (yResult * scale);

        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        // Dashed lines
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(px, centerY);
        ctx.lineTo(px, py);
        ctx.lineTo(centerX, py);
        ctx.stroke();
        ctx.setLineDash([]);

        // Text
        ctx.font = '14px Prompt';
        ctx.fillStyle = '#333';
        ctx.fillText(`x=${highlightX}`, px + 5, centerY + 15);
        ctx.fillText(`?`, centerX + 5, py - 5);
    }
}
