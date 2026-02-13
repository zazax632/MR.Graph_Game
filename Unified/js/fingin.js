// --- CONFIG & DATA ---

const ACHIEVEMENTS = [
    { id: 'first_blood', title: 'First Math', icon: '🩸', desc: 'Answer your first question correctly.' },
    { id: 'combo_5', title: 'On Fire', icon: '🔥', desc: 'Reach a streak of 5.' },
    { id: 'speedster', title: 'Speed Demon', icon: '⚡', desc: 'Answer in Speed Mode.' },
    { id: 'graph_master', title: 'Graph Guru', icon: '📈', desc: 'Complete 5 Graph questions.' }, // Fix condition logic later
    { id: 'level_5', title: 'Mid-Term', icon: '🎓', desc: 'Reach Level 5.' }
];

const MODES = [
    { id: 1, title: 'True / False', icon: '❓', lockLvl: 1 },
    { id: 2, title: 'Matching', icon: '🔗', lockLvl: 2 },
    { id: 3, title: 'Speed Mode', icon: '⚡', lockLvl: 3 },
    { id: 4, title: 'Reading Graphs', icon: '📈', lockLvl: 4 },
    { id: 5, title: 'Fill Blanks', icon: '✍️', lockLvl: 5 },
    { id: 6, title: 'BOSS BATTLE', icon: '👹', lockLvl: 6 } // Boss
];

const LESSONS = {
    1: { title: "ฟังก์ชันคืออะไร?", content: "ฟังก์ชัน คือ ความสัมพันธ์ที่สมาชิกในโดเมน (ตัวหน้า) แต่ละตัว จับคู่กับสมาชิกในเรนจ์ (ตัวหลัง) เพียงตัวเดียวเท่านั้น<br><br><b>ตัวอย่างที่เป็นฟังก์ชัน:</b> {(1,a), (2,b), (3,a)} (ตัวหน้าไม่ซ้ำ)<br><b>ตัวอย่างที่ไม่เป็น:</b> {(1,a), (1,b)} (1 จับคู่หลายตัว)" },
    2: { title: "โดเมนและเรนจ์", content: "โดเมน (Domain) คือ เซตของสมาชิกตัวหน้า (x)<br>เรนจ์ (Range) คือ เซตของสมาชิกตัวหลัง (y)<br><br>เราสามารถหาค่าเรนจ์ได้โดยการแทนค่า x ลงในสมการ f(x)" },
    3: { title: "Speed Calculation", content: "ในโหมดนี้ ความเร็วคือเรื่องสำคัญ! คุณต้องแทนค่า x ลงในสมการเชิงเส้นง่ายๆ เช่น f(x) = 2x + 1<br>ฝึกคิดเลขในใจให้ไวที่สุด!" },
    4: { title: "การอ่านกราฟ", content: "กราฟเส้นตรง (Linear) อยู่ในรูป f(x) = mx + c<br>กราฟพาราโบลา (Parabola) อยู่ในรูป f(x) = ax² + bx + c<br><br>การหาค่า f(k) คือการดูที่แกน X = k แล้วลากไปชนกราฟ เพื่อดูค่า Y" },
    5: { title: "การหาค่าที่หายไป", content: "ตารางค่าความจริงของฟังก์ชันมักจะมีความสัมพันธ์ที่แน่นอน ลองสังเกตการเปลี่ยนแปลงจาก x ไป y ว่าเพิ่มขึ้นหรือลดลงอย่างไร" },
    6: { title: "BOSS BATTLE", content: "บททดสอบสุดท้าย! รวมทุกเรื่องที่เรียนมา คุณมีโอกาสผิดได้เพียง 3 ครั้งเท่านั้น ขอให้โชคดี!" }
};

// --- CORE ENGINE ---

const ui = {
    screens: ['view-login', 'view-menu', 'view-game', 'view-leaderboard', 'view-achievements', 'view-2p'],
    chartInstance: null,

    showScreen(id) {
        this.screens.forEach(s => {
            const el = document.getElementById(s);
            if (s === id) { el.classList.remove('hidden'); el.classList.add('active'); }
            else { el.classList.add('hidden'); el.classList.remove('active'); }
        });
    },

    showMenu() {
        this.showScreen('view-menu');
    },

    showLeaderboard() {
        const list = document.getElementById('leaderboardList');
        const scores = utils.getScores(); // Fix: Use utils.getScores() helper if available, or implement here.
        // Actually, let's use the local storage 'fingin_player' for now or the leaderboard logic from utils?
        // Utils has saveScore and getScores. 
        // But the game currently just saves 'fingin_player'. 
        // Let's implement a simple display for now based on what was there or what utils provides.
        // The utils.js has getScores().
        const data = utils.getScores();
        list.innerHTML = data.map((s, i) => `<li>${i + 1}. ${s.name} - ${s.score}</li>`).join('');
        this.showScreen('view-leaderboard');
    },

    initMenu() {
        // Render Mode Grid with Locked Status
        const grid = document.getElementById('modeGrid');
        grid.innerHTML = MODES.map(m => {
            const isLocked = game.state.player.level < m.lockLvl;
            const clickAction = isLocked ? `alert('Unlock at Level ${m.lockLvl}')` : `game.startMode(${m.id})`;
            return `
                <div class="mode-card ${isLocked ? 'locked' : ''} ${m.id === 6 ? 'boss-card' : ''}" 
                     onclick="${clickAction}" style="${m.id === 6 ? 'grid-column: span 3; background:#ffeaa7;' : ''}">
                    <div class="mode-icon">${m.icon}</div>
                    <div class="mode-title">${m.title}</div>
                    ${isLocked ? `<div style="font-size:0.7rem; color:red;">Lvl ${m.lockLvl}</div>` : ''}
                </div>
            `;
        }).join('');
    },

    openLesson(modeId) {
        const modal = document.getElementById('lessonModal');
        const l = LESSONS[modeId];
        document.getElementById('lessonTitle').textContent = l.title;
        document.getElementById('lessonContent').innerHTML = l.content;
        modal.classList.remove('hidden');

        // Store current targeting mode
        this.pendingMode = modeId;
    },

    closeLesson() {
        document.getElementById('lessonModal').classList.add('hidden');
        if (this.pendingMode) {
            game.startMode(this.pendingMode);
            this.pendingMode = null;
        }
    },

    updateHUD(state) {
        if (state.in2PMode) {
            document.getElementById('p1Score').textContent = state.p1.score;
            document.getElementById('p2Score').textContent = state.p2.score;
            return;
        }

        document.getElementById('gameScore').textContent = state.score;
        document.getElementById('gameTimer').textContent = state.timeLeft;

        let pct = (state.mode === 3) ? (state.timeLeft / 30) * 100 : (state.questionsAnswered / 10) * 100;
        document.getElementById('gameProgress').style.width = `${pct}%`;

        if (state.mode === 6) {
            document.getElementById('bossHPContainer').classList.remove('hidden');
            document.getElementById('bossLives').textContent = "❤".repeat(state.lives);
        } else {
            const bossBox = document.getElementById('bossHPContainer');
            if (bossBox) bossBox.classList.add('hidden');
        }
    },

    renderChart(q) {
        const ctx = document.getElementById('graphCanvas').getContext('2d');
        if (this.chartInstance) this.chartInstance.destroy();

        // Generate points
        const points = [];
        const labels = [];
        for (let x = -5; x <= 5; x += 0.5) {
            let y = (q.params.type === 'linear')
                ? (q.params.m * x + q.params.c)
                : (q.params.a * x * x + q.params.c); // Simplified parabola
            points.push(y);
            labels.push(x);
        }

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: q.label,
                    data: points,
                    borderColor: '#4e54c8',
                    tension: 0.4,
                    pointRadius: (ctx) => {
                        // Highlight the query point
                        const index = ctx.dataIndex;
                        const val = parseFloat(labels[index]);
                        return val === q.queryX ? 8 : 0;
                    },
                    pointBackgroundColor: '#ff6b6b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'X' } },
                    y: { title: { display: true, text: 'f(x)' }, min: Math.min(...points) - 2, max: Math.max(...points) + 2 }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: (ctx) => `x = ${ctx[0].label}`,
                            label: (ctx) => `f(x) = ${ctx.raw}`
                        }
                    }
                }
            }
        });
    },

    showAchievements() {
        const list = document.getElementById('achievementList');
        const unlocked = game.state.player.achievements || [];

        list.innerHTML = ACHIEVEMENTS.map(ach => {
            const hasIt = unlocked.includes(ach.id);
            return `
                <div class="achievement-card ${hasIt ? 'unlocked' : ''}">
                    <span class="ach-icon">${ach.icon}</span>
                    <h3>${ach.title}</h3>
                    <p style="font-size:0.8rem; color:#666;">${ach.desc}</p>
                </div>
            `;
        }).join('');
        this.showScreen('view-achievements');
    },

    showFeedback(isCorrect, change, expl) {
        // Reuse existing feedback logic
        const overlay = document.getElementById('feedbackOverlay');
        const text = document.getElementById('feedbackText');
        const ex = document.getElementById('feedbackExplanation');

        overlay.classList.remove('hidden', 'correct', 'wrong');
        overlay.classList.add(isCorrect ? 'correct' : 'wrong');
        text.textContent = isCorrect ? `เยี่ยมมาก! +${change}` : `ผิดจ้า! ${change}`;
        ex.textContent = expl || "";

        setTimeout(() => overlay.classList.add('hidden'), 1500);
    }
};

const game = {
    state: {
        player: { name: '', xp: 0, level: 1, achievements: [] },
        mode: 0,
        score: 0,
        timeLeft: 30,
        timerInterval: null,
        isPlaying: false,
        currentQ: null,
        questionsAnswered: 0,
        lives: 3,
        in2PMode: false,
        p1: { score: 0 },
        p2: { score: 0 }
    },

    init() {
        // Load local content
        const saved = localStorage.getItem('fingin_player');
        if (saved) {
            const p = JSON.parse(saved);
            this.state.player = { ...this.state.player, ...p }; // merge
        }

        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('playerName').value;
            if (name) {
                this.state.player.name = name;
                this.save();
                this.updateMenu();
                ui.showMenu();
                utils.playSound('click');
            }
        });

        // Initial render
        ui.initMenu();
    },

    save() {
        localStorage.setItem('fingin_player', JSON.stringify(this.state.player));
    },

    updateMenu() {
        document.getElementById('displayPlayerName').textContent = this.state.player.name;
        document.getElementById('menuLevel').textContent = this.state.player.level;
        document.getElementById('menuXP').textContent = this.state.player.xp;
        ui.initMenu();
    },

    unlockAchievement(id) {
        if (!this.state.player.achievements.includes(id)) {
            this.state.player.achievements.push(id);
            this.save();
            alert(`🏆 Achievement Unlocked: ${ACHIEVEMENTS.find(a => a.id === id).title}`);
            utils.playSound('correct');
        }
    },

    startMode(modeId) {
        this.state.mode = modeId;
        this.state.score = 0;
        this.state.questionsAnswered = 0;
        this.state.lives = 3;
        this.state.isPlaying = true;
        this.state.in2PMode = false;

        if (modeId === 3) this.state.timeLeft = 30; else this.state.timeLeft = 0;

        ui.showScreen('view-game');
        this.nextQuestion();
        if (modeId === 3) this.startGlobalTimer();
    },

    start2PMode() {
        this.state.in2PMode = true;
        this.state.p1.score = 0;
        this.state.p2.score = 0;
        ui.showScreen('view-2p');

        // Render identical questions for both
        this.next2PQuestion();
    },

    next2PQuestion() {
        const q = questionGenerator.generate(3, 1); // Use Speed Mode questions (simple calc)
        this.state.current2PQ = q;

        // Render P1 (Left) - Uses Buttons
        const c1 = document.getElementById('p1Content');
        const ctrl1 = document.getElementById('p1Controls');
        c1.innerHTML = `<div style="font-size:1.5rem; color:var(--primary); font-weight:bold;">${q.funcStr}</div><div style="font-size:1.2rem;">${q.query} = ?</div>`;
        this.render2PControls(ctrl1, q.answer, 1);

        // Render P2 (Right) - Uses Buttons
        const c2 = document.getElementById('p2Content');
        const ctrl2 = document.getElementById('p2Controls');
        c2.innerHTML = `<div style="font-size:1.5rem; color:var(--primary); font-weight:bold;">${q.funcStr}</div><div style="font-size:1.2rem;">${q.query} = ?</div>`;
        this.render2PControls(ctrl2, q.answer, 2);
    },

    render2PControls(container, ans, playerNum) {
        // Generate options
        let opts = [ans];
        while (opts.length < 4) opts.push(ans + utils.randomInt(-5, 5) || ans + 1);
        opts = utils.shuffle(opts);

        container.innerHTML = `<div class="mode-grid" style="grid-template-columns:1fr 1fr; gap:10px;">
            ${opts.map(o => `<button class="btn-small" onclick="game.check2P(${playerNum}, ${o})">${o}</button>`).join('')}
        </div>`;
    },

    check2P(player, val) {
        if (val === this.state.current2PQ.answer) {
            if (player === 1) this.state.p1.score++;
            else this.state.p2.score++;

            ui.updateHUD(this.state);
            utils.playSound('correct');
            this.next2PQuestion();
        } else {
            // Wrong answer penalty?
            utils.playSound('wrong');
        }
    },

    startGlobalTimer() {
        clearInterval(this.state.timerInterval);
        this.state.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            ui.updateHUD(this.state);
            if (this.state.timeLeft <= 0) this.finishGame("Time's Up!");
        }, 1000);
    },

    nextQuestion() {
        if (!this.state.isPlaying) return;

        // Check win
        if (this.state.mode !== 3 && this.state.questionsAnswered >= 10 && this.state.mode !== 6) {
            this.finishGame("Level Complete!");
            return;
        }

        const diff = Math.floor(this.state.questionsAnswered / 3) + 1;
        this.state.currentQ = questionGenerator.generate(this.state.mode, diff);

        const container = document.getElementById('gameContent');
        this.renderQuestion(container, this.state.currentQ);
        ui.updateHUD(this.state);
    },

    renderQuestion(container, q) {
        container.innerHTML = `<h2 style="margin-bottom:20px;">${q.instruction}</h2>`;

        if (q.type === 'true_false') {
            let html = '';
            if (q.display === 'mapping') {
                html += `
                    <div style="display:flex; justify-content:center; gap:30px; margin:20px;">
                        <div style="border:2px solid #ccc; padding:15px; border-radius:10px;">
                            ${q.data.pairs.map(p => `<div>${p[0]}</div>`).join('')}
                        </div>
                        <div style="display:flex; flex-direction:column; justify-content:center; font-size:2rem;">➜</div>
                        <div style="border:2px solid #ccc; padding:15px; border-radius:10px;">
                            ${q.data.pairs.map(p => `<div>${p[1]}</div>`).join('')}
                        </div>
                    </div>`;
            } else {
                html += `<div style="font-size:1.8rem; margin:20px; font-weight:bold;">${q.data}</div>`;
            }
            html += `
                <div class="options-grid">
                    <button class="option-btn" onclick="game.validateAns(true)">Function</button>
                    <button class="option-btn" onclick="game.validateAns(false)">Not Function</button>
                </div>`;
            container.innerHTML += html;
        } else if (q.type === 'graph') {
            container.innerHTML += `
                <div class="chart-container"><canvas id="graphCanvas"></canvas></div>
                <div class="options-grid" style="margin-top:20px;">
                    ${q.options.map(o => `<button class="option-btn" onclick="game.validateAns(${o})">${o}</button>`).join('')}
                </div>
            `;
            setTimeout(() => ui.renderChart(q), 50);
        } else if (q.type === 'input' || q.type === 'fill_blank') {
            // ... (Same as before)
            container.innerHTML += `
                <div style="font-size:2rem; margin:20px; color:var(--primary);">${q.funcStr}</div>
                ${q.query ? `<div style="font-size:1.5rem;">หาค่า ${q.query}</div>` : ''}
                ${q.rows ? `<table class="blank-table"><tr><th>x</th>${q.rows.map(r => `<td>${r.x}</td>`).join('')}</tr><tr><th>y</th>${q.rows.map(r => `<td>${r.y}</td>`).join('')}</tr></table>` : ''}
                <input type="number" id="inputAns" class="calc-input" placeholder="?">
                <button class="btn-primary" onclick="game.validateAns(parseFloat(document.getElementById('inputAns').value))">Submit</button>
            `;
        } else {
            // Drag Drop matching fallback wrapper
            this.renderMatching(container, q);
        }
    },

    renderMatching(container, q) {
        // Same drag drop render logic
        const leftItems = utils.shuffle(q.pairs.map(p => ({ ...p })));
        const rightItems = utils.shuffle(q.pairs.map(p => ({ ...p })));
        container.innerHTML += `
             <div style="font-size:1.5rem; color:var(--primary); font-weight:bold;">${q.funcStr}</div>
             <div class="matching-container">
                <div class="matching-col">
                    ${leftItems.map(i => `<div class="draggable-item" draggable="true" data-match="${i.match}">x = ${i.val}</div>`).join('')}
                </div>
                <div class="matching-col">
                    ${rightItems.map(i => `<div class="drop-zone" data-id="${i.match}"><span>y = ${i.y}</span><div class="drop-slot"></div></div>`).join('')}
                </div>
             </div>
             <button class="btn-primary" style="margin-top:20px;" onclick="game.validateMatching()">ส่งคำตอบ</button>
        `;
        setTimeout(() => this.initDragDrop(), 100);
    },

    initDragDrop() {
        const draggables = document.querySelectorAll('.draggable-item');
        const slots = document.querySelectorAll('.drop-slot');
        draggables.forEach(d => {
            d.addEventListener('dragstart', () => d.classList.add('dragging'));
            d.addEventListener('dragend', () => d.classList.remove('dragging'));
        });
        slots.forEach(s => {
            s.addEventListener('dragover', e => e.preventDefault());
            s.addEventListener('drop', e => {
                const d = document.querySelector('.dragging');
                if (d && s.children.length === 0) s.appendChild(d);
            });
        });
    },

    validateMatching() {
        // ... (Same validation logic)
        const slots = document.querySelectorAll('.drop-slot');
        let filled = 0, correct = 0;
        slots.forEach(s => {
            if (s.children.length > 0) {
                filled++;
                if (s.children[0].dataset.match === s.parentElement.dataset.id) correct++;
            }
        });
        if (filled < 4) { ui.showFeedback(false, 0, "จับคู่ให้ครบ!"); return; }
        this.checkAnswer(correct === 4);
    },

    validateAns(userVal) {
        // Compare user value with current question answer
        const correctVal = this.state.currentQ.answer;

        // Handle floating point precision for numbers
        let isCorrect = false;
        if (typeof correctVal === 'number' && typeof userVal === 'number') {
            isCorrect = Math.abs(userVal - correctVal) < 0.001;
        } else {
            isCorrect = (userVal === correctVal);
        }

        this.checkAnswer(isCorrect);
    },

    checkAnswer(isCorrect) {
        if (isCorrect) {
            this.state.score += 10;
            this.state.questionsAnswered++;
            this.state.player.xp += 20;
            this.unlockAchievement('first_blood');
            this.checkLevelUp();
            utils.playSound('correct');
        } else {
            this.state.score -= 5;
            if (this.state.mode === 6) {
                this.state.lives--;
                if (this.state.lives === 0) { this.finishGame("Boss Defeated You!"); return; }
            }
            utils.playSound('wrong');
        }
        ui.showFeedback(isCorrect, isCorrect ? 10 : -5, isCorrect ? null : this.state.currentQ.hint);
        ui.updateHUD(this.state);
        setTimeout(() => this.nextQuestion(), 1500);
    },

    checkLevelUp() {
        const newLvl = Math.floor(Math.sqrt(this.state.player.xp / 100)) + 1;
        if (newLvl > this.state.player.level) {
            this.state.player.level = newLvl;
            if (newLvl === 5) this.unlockAchievement('level_5');
            alert(`Level Up! You are now Level ${newLvl}`);
            this.save();
            this.updateMenu(); // Refreshes locked modes
        }
    },

    finishGame(msg) {
        this.state.isPlaying = false;
        clearInterval(this.state.timerInterval);
        alert(msg);
        this.save();
        ui.showMenu();
    },

    quitMode() {
        this.finishGame("Exited");
    },

    logout() { location.reload(); }
};

window.ui = ui;
window.game = game;

window.onload = () => game.init();
