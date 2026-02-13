const mathGame = {
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
        p2: { score: 0 },
        matchingSelection: { left: null, right: null }
    },

    ACHIEVEMENTS: [
        { id: 'first_blood', title: 'First Math', icon: '🩸', desc: 'Answer your first question correctly.' },
        { id: 'combo_5', title: 'On Fire', icon: '🔥', desc: 'Reach a streak of 5.' },
        { id: 'speedster', title: 'Speed Demon', icon: '⚡', desc: 'Answer in Speed Mode.' },
        { id: 'graph_master', title: 'Graph Guru', icon: '📈', desc: 'Complete 5 Graph questions.' },
        { id: 'level_5', title: 'Mid-Term', icon: '🎓', desc: 'Reach Level 5.' }
    ],

    MODES: [
        { id: 1, title: 'True / False', icon: '❓', lockLvl: 1 },
        { id: 2, title: 'Matching', icon: '🔗', lockLvl: 1 },
        { id: 3, title: 'Speed Mode', icon: '⚡', lockLvl: 1 },
        { id: 4, title: 'Reading Graphs', icon: '📈', lockLvl: 1 },
        { id: 5, title: 'Fill Blanks', icon: '✍️', lockLvl: 1 },
        { id: 6, title: 'BOSS BATTLE', icon: '👹', lockLvl: 1 }
    ],

    init() {
        const saved = localStorage.getItem('fingin_player');
        if (saved) {
            const p = JSON.parse(saved);
            this.state.player = { ...this.state.player, ...p };
        } else {
            // New player defaults
            this.state.player = { name: app.state.pilotName, xp: 0, level: 1, achievements: [] };
        }

        // Locked status is now ignored in renderMenu, so natural level can stay at 1.

        const container = document.getElementById('page-math');
        container.innerHTML = `
            <div class="glass-panel" style="max-width: 900px; margin: 20px auto; padding: 20px; position: relative;">
                <div class="game-hud" style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--primary); padding-bottom: 10px; margin-bottom: 20px;">
                    <div style="display: flex; flex-direction: column;">
                        <div class="neon-text" style="font-size: 0.8rem;">PILOT: <span id="math-p-name">-</span> (LVL <span id="math-p-lvl">1</span>)</div>
                        <div class="neon-text">SCORE: <span id="math-score">0</span></div>
                    </div>
                    <div style="text-align: center;">
                        <div class="neon-text">SYSTEM STABILITY: <span id="math-timer">30</span>%</div>
                        <div id="math-progress-container" style="width: 150px; height: 5px; background: rgba(0,242,255,0.1); margin-top: 5px;">
                            <div id="math-progress-bar" style="width: 0%; height: 100%; background: var(--primary); transition: width 0.3s;"></div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div id="boss-lives-box" style="display:none;" class="neon-text">INTEGRITY: <span id="math-lives" style="color: var(--secondary);">❤❤❤</span></div>
                        <button class="btn-cyber" onclick="mathGame.quitGame()" style="padding: 5px 10px; font-size: 0.7rem;">EXIT</button>
                    </div>
                </div>
                <div id="math-game-content" style="min-height: 400px; text-align: center; position: relative;">
                    <!-- Content injected here -->
                </div>
                
                <div id="math-feedback" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; opacity: 0; transition: opacity 0.3s; z-index: 10;">
                    <h1 id="math-feedback-text" class="neon-text" style="font-size: 4rem;">SYNCED</h1>
                </div>
            </div>
        `;

        this.updateHUD();
        this.renderMenu();
    },

    save() {
        localStorage.setItem('fingin_player', JSON.stringify(this.state.player));
    },

    updateHUD() {
        const p = this.state.player;
        if (document.getElementById('math-p-name')) {
            document.getElementById('math-p-name').textContent = p.name || app.state.pilotName || "PILOT";
            document.getElementById('math-p-lvl').textContent = p.level;
            document.getElementById('math-score').textContent = this.state.score;
            document.getElementById('math-timer').textContent = this.state.timeLeft;

            let pct = (this.state.mode === 3) ? (this.state.timeLeft / 30) * 100 : (this.state.questionsAnswered / 10) * 100;
            document.getElementById('math-progress-bar').style.width = `${Math.min(100, pct)}%`;

            if (this.state.mode === 6) {
                document.getElementById('boss-lives-box').style.display = 'block';
                document.getElementById('math-lives').textContent = "❤".repeat(this.state.lives);
            } else {
                document.getElementById('boss-lives-box').style.display = 'none';
            }
        }
    },

    renderMenu() {
        this.state.isPlaying = false;
        clearInterval(this.state.timerInterval);

        const content = document.getElementById('math-game-content');
        content.innerHTML = `
            <h2 class="neon-text" style="margin-bottom: 30px;">Select Sub-System Mode</h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                ${this.MODES.map(m => {
            const isLocked = false; // All unlocked as requested
            return `
                        <div class="glass-panel mode-card" 
                             onclick="mathGame.startMode(${m.id})" 
                             style="padding: 20px; cursor: pointer; opacity: 1; ${m.id === 6 ? 'grid-column: span 3; border-color: var(--secondary);' : ''}">
                            <div style="font-size: 2rem;">${m.icon}</div>
                            <h3 class="neon-text" style="font-size: 1rem; margin-top: 10px;">${m.title}</h3>
                        </div>
                    `;
        }).join('')}
            </div>
            <div style="margin-top: 30px; display: flex; gap: 20px; justify-content: center;">
                <button class="btn-cyber" onclick="mathGame.showAchievements()">ACHIEVEMENTS</button>
                <button class="btn-cyber" onclick="mathGame.start2P()">LOCAL VS MODE</button>
            </div>
        `;
    },

    startMode(id) {
        this.state.mode = id;
        this.state.score = 0;
        this.state.questionsAnswered = 0;
        this.state.lives = 3;
        this.state.isPlaying = true;
        this.state.in2PMode = false;
        this.state.timeLeft = (id === 3) ? 30 : 0;

        this.updateHUD();
        this.nextQuestion();
        if (id === 3) this.startTimer();
    },

    nextQuestion() {
        if (!this.state.isPlaying) return;

        if (this.state.mode !== 3 && this.state.questionsAnswered >= 10 && this.state.mode !== 6) {
            this.finishGame("MISSION SUCCESS: ALL NODES SYNCED");
            return;
        }

        const diff = Math.floor(this.state.questionsAnswered / 3) + 1;
        this.state.currentQ = questionGenerator.generate(this.state.mode, diff);

        const container = document.getElementById('math-game-content');
        this.renderQuestion(container, this.state.currentQ);
        this.updateHUD();
    },

    renderQuestion(container, q) {
        container.innerHTML = `<h3 class="neon-text" style="margin-bottom: 20px; font-size: 1.1rem;">${q.instruction}</h3>`;

        if (q.type === 'true_false') {
            container.innerHTML += `
                <div class="glass-panel" style="margin: 20px auto; padding: 30px; font-size: 2.2rem; max-width: 500px; background: rgba(0,0,0,0.5);">
                    ${typeof q.data === 'object' ? this.formatMapping(q.data) : q.data}
                </div>
                <div style="display: flex; justify-content: center; gap: 30px;">
                    <button class="btn-cyber" onclick="mathGame.validateAns(true)" style="width: 180px; height: 50px; font-size: 1.1rem;">TRUE</button>
                    <button class="btn-cyber" onclick="mathGame.validateAns(false)" style="width: 180px; height: 50px; font-size: 1.1rem; border-color: var(--secondary); color: var(--secondary);">FALSE</button>
                </div>
                <div class="neon-text" style="font-size: 0.8rem; margin-top: 15px; opacity: 0.7;">HINT: ${q.hint}</div>
            `;
        } else if (q.type === 'matching') {
            this.state.matchingSelection = { left: null, right: null };
            this.state.currentMatchCount = 0;
            const leftItems = q.pairs.map(p => ({ id: p.val, label: `x = ${p.val}` })).sort(() => Math.random() - 0.5);
            const rightItems = q.pairs.map(p => ({ id: p.val, label: `y = ${p.y}` })).sort(() => Math.random() - 0.5);

            container.innerHTML += `
                <div class="neon-text" style="font-size: 1.5rem; margin-bottom: 20px;">${q.funcStr}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; max-width: 600px; margin: 0 auto;">
                    <div id="matching-left" style="display: flex; flex-direction: column; gap: 10px;">
                        ${leftItems.map(item => `<button class="btn-cyber matching-btn" data-type="left" data-id="${item.id}" onclick="mathGame.handleMatchSelect(this)">${item.label}</button>`).join('')}
                    </div>
                    <div id="matching-right" style="display: flex; flex-direction: column; gap: 10px;">
                        ${rightItems.map(item => `<button class="btn-cyber matching-btn" data-type="right" data-id="${item.id}" onclick="mathGame.handleMatchSelect(this)">${item.label}</button>`).join('')}
                    </div>
                </div>
                <div id="match-status" class="neon-text" style="margin-top: 20px; font-size: 0.9rem;">Select pairs to match</div>
            `;
        } else if (q.type === 'graph') {
            container.innerHTML += `
                <div style="font-size: 1.2rem; color: var(--primary); margin-bottom: 10px;">${q.label}</div>
                <div id="game-graph-target" style="width: 100%; height: 250px; background: rgba(0,0,0,0.3); margin-bottom: 20px;"></div>
                <div class="neon-text" style="font-size: 1.1rem; margin-bottom: 15px;">จงหาค่าของ f(${q.queryX}) ?</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; max-width: 400px; margin: 0 auto;">
                    ${q.options.map(o => `<button class="btn-cyber" onclick="mathGame.validateAns(${o})">${o}</button>`).join('')}
                </div>
            `;
            this.drawGameGraph(q);
        } else if (q.type === 'input') {
            container.innerHTML += `
                <div class="neon-text" style="font-size: 2.5rem; margin-bottom: 20px;">${q.funcStr}</div>
                <div style="font-size: 1.5rem; margin-bottom: 20px; color: var(--primary);">${q.query} = ?</div>
                <div style="display: flex; justify-content: center; gap: 10px; align-items: center;">
                    <input type="number" id="math-ans-input" style="text-align: center; font-size: 2rem; width: 150px;" autofocus>
                    <button class="btn-cyber" onclick="mathGame.validateAns(parseFloat(document.getElementById('math-ans-input').value))">EXECUTE</button>
                </div>
            `;
            setTimeout(() => document.getElementById('math-ans-input')?.focus(), 100);
        } else if (q.type === 'fill_blank') {
            const tableRows = q.rows.map(r => `
                <tr style="border-bottom: 1px solid rgba(0,242,255,0.1);">
                    <td style="padding: 10px;">${r.x}</td>
                    <td style="padding: 10px;">${r.y === '?' ? '<input type="number" id="math-blank-input" style="width: 80px; text-align: center;">' : r.y}</td>
                </tr>
            `).join('');

            container.innerHTML += `
                <div class="neon-text" style="font-size: 1.8rem; margin-bottom: 20px;">${q.funcStr}</div>
                <div class="glass-panel" style="max-width:300px; margin: 0 auto 20px; padding: 15px;">
                    <table style="width:100%; text-align:center;">
                        <thead><tr style="border-bottom: 2px solid var(--primary);"><th>x</th><th>f(x)</th></tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
                <button class="btn-cyber" onclick="mathGame.validateAns(parseFloat(document.getElementById('math-blank-input').value))">SUBMIT</button>
            `;
            setTimeout(() => document.getElementById('math-blank-input')?.focus(), 100);
        }
    },

    formatMapping(data) {
        return `
            <div style="display: flex; justify-content: space-around; font-size: 1rem; align-items: center;">
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <span style="border-bottom: 1px solid var(--primary); margin-bottom: 5px;">Domain</span>
                    ${data.domain.map(d => `<span>${d}</span>`).join('')}
                </div>
                <div style="font-size: 1.5rem;">→</div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <span style="border-bottom: 1px solid var(--secondary); margin-bottom: 5px;">Range</span>
                    ${[...new Set(data.pairs.map(p => p[1]))].sort((a, b) => a - b).map(r => `<span>${r}</span>`).join('')}
                </div>
            </div>
            <div style="font-size: 0.8rem; margin-top: 15px; color: var(--primary);">
                Pairs: { ${data.pairs.map(p => `(${p[0]},${p[1]})`).join(', ')} }
            </div>
        `;
    },

    handleMatchSelect(btn) {
        const type = btn.dataset.type;
        const id = btn.dataset.id;
        const parentId = type === 'left' ? 'matching-left' : 'matching-right';

        document.querySelectorAll(`#${parentId} .matching-btn`).forEach(b => b.classList.remove('active-nav')); // Reuse active-nav or define simple style
        btn.classList.add('active-nav');

        this.state.matchingSelection[type] = id;

        if (this.state.matchingSelection.left && this.state.matchingSelection.right) {
            if (this.state.matchingSelection.left === this.state.matchingSelection.right) {
                // Correct match
                document.querySelector(`#matching-left [data-id="${id}"]`).style.visibility = 'hidden';
                document.querySelector(`#matching-right [data-id="${id}"]`).style.visibility = 'hidden';
                this.state.matchingSelection = { left: null, right: null };

                // Track matches
                this.state.currentMatchCount = (this.state.currentMatchCount || 0) + 1;
                if (this.state.currentMatchCount >= 4) {
                    this.state.currentMatchCount = 0;
                    this.validateAns(true);
                } else {
                    document.getElementById('match-status').textContent = `Correct! (${this.state.currentMatchCount}/4)`;
                    document.getElementById('match-status').style.color = 'var(--primary)';
                }
            } else {
                // Wrong match
                document.getElementById('match-status').textContent = "Mismatch! Try again.";
                document.getElementById('match-status').style.color = 'var(--secondary)';
                this.state.matchingSelection = { left: null, right: null };
                document.querySelectorAll('.matching-btn').forEach(b => b.classList.remove('active-nav'));
            }
        }
    },

    drawGameGraph(q) {
        setTimeout(() => {
            const target = '#game-graph-target';
            const el = document.querySelector(target);
            if (!el) return;

            const expression = q.params.type === 'linear'
                ? `${q.params.m}*x + ${q.params.c}`
                : `${q.params.a}*x^2 + ${q.params.c}`;

            try {
                functionPlot({
                    target: target,
                    width: el.clientWidth,
                    height: el.clientHeight,
                    xAxis: { domain: [-5, 5] },
                    yAxis: { domain: [-5, 5] },
                    grid: true,
                    data: [{
                        fn: expression,
                        color: '#00f2ff',
                        graphType: 'polyline'
                    }, {
                        points: [[q.queryX, q.answer]],
                        fnType: 'points',
                        graphType: 'scatter',
                        color: 'var(--secondary)',
                        attr: { r: 5 }
                    }]
                });
            } catch (e) {
                console.error("Game Graph Plot Error:", e);
            }
        }, 50);
    },

    validateAns(userVal) {
        const correctVal = this.state.currentQ.answer;
        const isCorrect = (typeof correctVal === 'number')
            ? (Math.abs(userVal - correctVal) < 0.01)
            : (userVal === correctVal);

        if (isCorrect) {
            this.state.score += 10;
            this.state.questionsAnswered++;
            this.state.player.xp += 20;
            this.showFeedback(true);
            this.checkLevelUp();
        } else {
            this.state.score -= 5;
            if (this.state.mode === 6) {
                this.state.lives--;
                if (this.state.lives === 0) { this.finishGame("CRITICAL FAILURE: BOSS OVERRIDDEN SYSTEM"); return; }
            }
            this.showFeedback(false);
        }

        this.updateHUD();
        setTimeout(() => this.nextQuestion(), 1000);
    },

    showFeedback(isCorrect) {
        const fb = document.getElementById('math-feedback');
        const fbt = document.getElementById('math-feedback-text');
        fb.style.opacity = 1;
        fbt.textContent = isCorrect ? 'SYNCED' : 'ERROR';
        fbt.style.color = isCorrect ? 'var(--primary)' : 'var(--secondary)';
        setTimeout(() => fb.style.opacity = 0, 800);
    },

    checkLevelUp() {
        const newLvl = Math.floor(Math.sqrt(this.state.player.xp / 100)) + 1;
        if (newLvl > this.state.player.level) {
            this.state.player.level = newLvl;
            this.save();
            alert(`PILOT PROMOTED: REACHED LEVEL ${newLvl}`);
        }
    },

    startTimer() {
        clearInterval(this.state.timerInterval);
        this.state.timerInterval = setInterval(() => {
            if (!this.state.isPlaying) return;
            this.state.timeLeft--;
            this.updateHUD();
            if (this.state.timeLeft <= 0) this.finishGame("STABILITY LOSS: TIME EXPIRED");
        }, 1000);
    },

    finishGame(msg) {
        this.state.isPlaying = false;
        clearInterval(this.state.timerInterval);
        alert(msg + "\nFinal Score: " + this.state.score);
        this.save();
        this.renderMenu();
    },

    quitGame() {
        if (this.state.isPlaying) {
            this.state.isPlaying = false;
            clearInterval(this.state.timerInterval);
            this.renderMenu();
        } else {
            app.showPage('home');
        }
    },

    showAchievements() {
        const content = document.getElementById('math-game-content');
        const unlocked = this.state.player.achievements || [];
        content.innerHTML = `
            <h2 class="neon-text" style="margin-bottom: 20px;">Trophies of Logic</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                ${this.ACHIEVEMENTS.map(ach => {
            const hasIt = unlocked.includes(ach.id);
            return `
                        <div class="glass-panel" style="padding: 15px; opacity: ${hasIt ? 1 : 0.3}; filter: ${hasIt ? 'none' : 'grayscale(1)'}">
                            <div style="font-size: 1.5rem;">${ach.icon}</div>
                            <h4 style="margin: 5px 0;">${ach.title}</h4>
                            <p style="font-size: 0.7rem;">${ach.desc}</p>
                        </div>
                    `;
        }).join('')}
            </div>
            <button class="btn-cyber" style="margin-top: 20px;" onclick="mathGame.renderMenu()">BACK</button>
        `;
    },

    start2P() {
        this.state.in2PMode = true;
        this.state.isPlaying = true;
        this.state.p1.score = 0;
        this.state.p2.score = 0;

        const content = document.getElementById('math-game-content');
        content.innerHTML = `
            <div style="display: flex; height: 100%; gap: 20px;">
                <div id="p1-area" style="flex: 1; border-right: 1px solid var(--primary); padding: 10px;">
                    <h3 class="neon-text">PLAYER 1: <span id="math-p1-score">0</span></h3>
                    <div id="p1-q-content"></div>
                </div>
                <div id="p2-area" style="flex: 1; padding: 10px;">
                    <h3 class="neon-text" style="color: var(--secondary);">PLAYER 2: <span id="math-p2-score">0</span></h3>
                    <div id="p2-q-content"></div>
                </div>
            </div>
        `;
        this.next2PQuestion();
    },

    next2PQuestion() {
        const q = questionGenerator.generate(3, 1);
        this.state.current2PQ = q;
        this.render2PPanel(document.getElementById('p1-q-content'), q, 1);
        this.render2PPanel(document.getElementById('p2-q-content'), q, 2);
    },

    render2PPanel(container, q, pNum) {
        let opts = [q.answer];
        while (opts.length < 4) {
            const fake = q.answer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
            if (!opts.includes(fake)) opts.push(fake);
        }
        opts = opts.sort(() => Math.random() - 0.5);

        container.innerHTML = `
            <div style="font-size: 2rem; margin: 20px 0;">${q.funcStr}</div>
            <div style="font-size: 1rem; margin-bottom: 20px;">f(${q.queryX}) = ?</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                ${opts.map(o => `<button class="btn-cyber" onclick="mathGame.check2P(${pNum}, ${o})" style="${pNum === 2 ? 'border-color: var(--secondary); color: var(--secondary);' : ''}">${o}</button>`).join('')}
            </div>
        `;
    },

    check2P(pNum, val) {
        if (val === this.state.current2PQ.answer) {
            if (pNum === 1) this.state.p1.score++; else this.state.p2.score++;
            document.getElementById('math-p1-score').textContent = this.state.p1.score;
            document.getElementById('math-p2-score').textContent = this.state.p2.score;
            this.next2PQuestion();
        }
    }
};
