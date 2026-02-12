const ui = {
    screens: ['view-login', 'view-menu', 'view-game', 'view-leaderboard'],

    showScreen(id) {
        this.screens.forEach(s => {
            const el = document.getElementById(s);
            if (s === id) {
                el.classList.remove('hidden');
                el.classList.add('active');
            } else {
                el.classList.add('hidden');
                el.classList.remove('active');
            }
        });

        // Update helper visibility
        const helper = document.getElementById('aiHelper');
        if (id === 'view-login') helper.style.display = 'flex';
        else helper.style.display = 'flex';
    },

    updateHUD(score, timer, level) {
        document.getElementById('gameScore').textContent = score;
        document.getElementById('gameTimer').textContent = timer;
        document.getElementById('gameLevel').textContent = level;
    },

    showFeedback(isCorrect, scoreChange) {
        const overlay = document.getElementById('feedbackOverlay');
        const text = document.getElementById('feedbackText');

        overlay.classList.remove('hidden', 'correct', 'wrong');
        overlay.classList.add(isCorrect ? 'correct' : 'wrong');
        text.textContent = isCorrect ? `เยี่ยมมาก! +${scoreChange}` : `ผิดจ้า! ${scoreChange}`; // change text

        void overlay.offsetWidth; // trigger reflow

        // AI Message
        if (isCorrect) game.aiSay("ถูกต้องนะครับเก่งมาก!");
        else game.aiSay("ไม่เป็นไร ลองใหม่นะ!");

        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 1000);
    },

    showLeaderboard() {
        const list = document.getElementById('leaderboardList');
        const scores = utils.getScores();
        list.innerHTML = scores.map((s, i) => `
            <li>
                <span>#${i + 1} ${s.name}</span>
                <span>${s.score} คะแนน</span>
            </li>
        `).join('');
        this.showScreen('view-leaderboard');
    },

    showMenu() {
        this.showScreen('view-menu');
        document.getElementById('displayPlayerName').textContent = game.state.playerName;
        document.getElementById('menuXP').textContent = game.state.xp;
    }
};

const game = {
    state: {
        playerName: '',
        score: 0,
        level: 1,
        xp: 0,
        isPlaying: false,
        timerInterval: null,
        currentTime: 30
    },

    init() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('playerName').value;
            if (name) {
                this.state.playerName = name;
                ui.showMenu();
                utils.playSound('click');
                this.aiSay(`ยินดีต้อนรับ ${name}! พร้อมลุยไหม?`);
            }
        });
    },

    startLevel(levelId) {
        this.state.level = levelId;
        this.state.score = 0; // Reset score per level attempt? Or keep cumulative? User said "Points system", usually per run. Let's keep cumulative for the session
        this.state.isPlaying = true;

        ui.showScreen('view-game');
        this.aiSay(levels[`level${levelId}`].instruction);

        this.nextQuestion();
    },

    nextQuestion() {
        if (!this.state.isPlaying) return;

        // Reset Timer
        clearInterval(this.state.timerInterval);
        this.state.currentTime = 30; // 30 seconds per question
        ui.updateHUD(this.state.score, this.state.currentTime, this.state.level);

        this.state.timerInterval = setInterval(() => {
            this.state.currentTime--;
            ui.updateHUD(this.state.score, this.state.currentTime, this.state.level);
            if (this.state.currentTime <= 0) {
                this.handleAnswer(false, true); // Time out = wrong
            }
        }, 1000);

        // Load content based on level
        const contentDiv = document.getElementById('gameContent');
        contentDiv.innerHTML = '';

        const lvlData = levels[`level${this.state.level}`];
        if (!lvlData) return;

        // Pick random question
        if (this.state.level === 1) {
            this.renderLevel1(contentDiv, lvlData);
        } else if (this.state.level === 2) {
            this.renderLevel2(contentDiv, lvlData);
        } else if (this.state.level === 3) {
            this.renderLevel3(contentDiv, lvlData);
        } else if (this.state.level === 4) {
            this.renderLevel4(contentDiv, lvlData);
        }
    },

    renderLevel1(container, data) {
        const q = utils.shuffle([...data.questions])[0]; // Pick one
        this.currentQuestion = q;

        let html = `<h2 style="margin-bottom:20px;">${data.instruction}</h2>`;

        // Render Visualization
        if (q.type === 'pairs') {
            html += `<div style="font-size: 2rem; margin: 30px; font-weight: bold; color: var(--primary);">${q.data}</div>`;
        } else {
            // Render basic mapping visualization
            html += `
                <div style="display:flex; justify-content:center; gap:50px; margin:20px;">
                    <div style="border:2px solid #ccc; padding:20px; border-radius:15px;">
                        <h4>Domain</h4>
                        ${q.data.pairs.map(p => `<div>${p[0]}</div>`).join('')}
                    </div>
                    <div style="display:flex; flex-direction:column; justify-content:center; font-size:2rem;">➜</div>
                    <div style="border:2px solid #ccc; padding:20px; border-radius:15px;">
                        <h4>Range</h4>
                        ${q.data.pairs.map(p => `<div>${p[1]}</div>`).join('')}
                    </div>
                </div>
            `;
        }

        html += `
            <div class="options-grid">
                <button class="option-btn" onclick="game.handleAnswer(true)">✅ เป็นฟังก์ชัน</button>
                <button class="option-btn" onclick="game.handleAnswer(false)">❌ ไม่เป็นฟังก์ชัน</button>
            </div>
            <p style="margin-top:20px; color:#888;">(Hint: ${q.hint})</p>
        `;
        container.innerHTML = html;
        this.currentAnswer = q.isFunction;
    },

    renderLevel2(container, data) {
        // Simple Mode: Just pick one set and make user match correct pairs
        const set = utils.shuffle([...data.sets])[0];
        const targetPair = set.pairs[utils.randomInt(0, set.pairs.length - 1)];
        this.currentQuestion = targetPair;

        // Generate options (1 correct, 3 wrong from other numbers)
        let options = [targetPair.y];
        while (options.length < 4) {
            let r = utils.randomInt(-10, 20);
            if (!options.includes(r)) options.push(r);
        }
        options = utils.shuffle(options);

        container.innerHTML = `
            <h2>${data.instruction}</h2>
            <div style="font-size: 2.5rem; margin: 30px; color: var(--primary);">
                ${set.func}
            </div>
            <div style="font-size: 1.5rem; margin-bottom: 30px;">
                ถ้า x = <span style="color: var(--accent); font-weight:bold;">${targetPair.x}</span>, y คืออะไร?
            </div>
            <div class="options-grid">
                ${options.map(opt => `
                    <button class="option-btn" onclick="game.handleAnswer(${opt})">${opt}</button>
                `).join('')}
            </div>
        `;
        this.currentAnswer = targetPair.y;
    },

    renderLevel3(container, data) {
        const q = utils.shuffle([...data.questions])[0];
        this.currentQuestion = q;

        container.innerHTML = `
            <h2>${data.instruction}</h2>
            <canvas id="graphCanvas" width="400" height="300"></canvas>
            <div class="options-grid" id="lvl3-options">
                <!-- Options generated below -->
            </div>
        `;

        requestAnimationFrame(() => {
            drawGraph(document.getElementById('graphCanvas'), q.type, q, q.queryX);
        });

        // Generate multiple choice options
        let options = [q.answer];
        while (options.length < 4) {
            let r = utils.randomInt(q.answer - 5, q.answer + 5);
            if (!options.includes(r)) options.push(r);
        }
        options = utils.shuffle(options);

        document.getElementById('lvl3-options').innerHTML = options.map(opt => `
            <button class="option-btn" onclick="game.handleAnswer(${opt})">${opt}</button>
        `).join('');

        this.currentAnswer = q.answer;
    },

    renderLevel4(container, data) {
        const q = utils.shuffle([...data.questions])[0];
        this.currentQuestion = q;

        container.innerHTML = `
            <h2>${data.instruction}</h2>
            <div style="font-size: 2.5rem; margin: 30px; color: var(--primary);">
                ${q.funcStr}
            </div>
            <div style="font-size: 1.5rem;">
                จงหาค่า f(<span style="color: var(--accent); font-weight:bold;">${q.x}</span>)
            </div>
            <input type="number" id="calcInput" class="calc-input" placeholder="คำตอบ">
            <button class="btn-primary" onclick="game.checkLevel4Input()">ส่งคำตอบ</button>
        `;
        this.currentAnswer = q.answer;
    },

    checkLevel4Input() {
        const val = parseInt(document.getElementById('calcInput').value);
        if (isNaN(val)) return;
        this.handleAnswer(val);
    },

    handleAnswer(userAns, isTimeout = false) {
        clearInterval(this.state.timerInterval);

        let isCorrect = false;

        // Check logic depending on level type
        if (this.state.level === 1) {
            // Level 1: Boolean match
            isCorrect = (userAns === this.currentAnswer);
        } else {
            // Level 2, 3, 4: Value match
            isCorrect = (userAns === this.currentAnswer);
        }

        if (isTimeout) isCorrect = false;

        // Scoring
        const scoreChange = isCorrect ? 10 : -5;
        this.state.score += scoreChange;
        if (this.state.score < 0) this.state.score = 0;

        if (isCorrect) {
            this.state.xp += 15;
            utils.playSound('correct');
        } else {
            utils.playSound('wrong');
        }

        ui.updateHUD(this.state.score, this.state.currentTime, this.state.level);
        ui.showFeedback(isCorrect, scoreChange);

        // Next question after delay
        setTimeout(() => {
            // For demonstration, infinite loop of questions. In a real game, maybe 5 questions per level then summary.
            // Let's do a simple check: if score > 50, level complete? Or just keep going.
            this.nextQuestion();
        }, 1500);
    },

    quitLevel() {
        this.state.isPlaying = false;
        clearInterval(this.state.timerInterval);
        ui.showMenu();
        utils.saveScore(this.state.playerName, this.state.score);
    },

    logout() {
        location.reload();
    },

    aiSay(msg) {
        const bubble = document.getElementById('aiMessage');
        bubble.textContent = msg;
        bubble.classList.add('show');
        setTimeout(() => {
            bubble.classList.remove('show');
        }, 3000);
    }
};

window.onload = () => {
    game.init();
};
