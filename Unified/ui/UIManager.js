import FunctionParser from '../game/FunctionParser.js';

export default class UIManager {
    constructor(scene) {
        this.scene = scene;

        // DOM Elements
        this.turnIndicator = document.getElementById('turn-indicator');
        this.input = document.getElementById('function-input');
        this.validationMsg = document.getElementById('validation-msg');
        this.previewBtn = document.getElementById('preview-btn');
        this.undoBtn = document.getElementById('undo-btn');
        this.fireBtn = document.getElementById('fire-btn');

        this.p1Hp = document.getElementById('p1-hp');
        this.p2Hp = document.getElementById('p2-hp');

        this.mouseCoords = document.getElementById('mouse-coords');
        this.playerInfo = document.getElementById('player-info');

        this.dirLeft = document.getElementById('dir-left');
        this.dirRight = document.getElementById('dir-right');
        this.currentDir = 1; // 1 for R, -1 for L

        this.mathButtons = document.querySelectorAll('.math-btn');
        this.historyList = document.getElementById('history-list');
        this.winnerModal = document.getElementById('winner-modal');
        this.winnerText = document.getElementById('winner-text');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.turnPopup = document.getElementById('turn-announcement');
        this.popupText = document.getElementById('announcement-text');

        this.inputContainer = document.getElementById('input-container');
        this.toggleBtn = document.getElementById('toggle-input-btn');

        this.history = [];

        this.setupListeners();
    }

    setupListeners() {
        this.input.addEventListener('input', () => {
            const result = FunctionParser.parse(this.input.value);
            this.updateValidation(result);
        });

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.fireBtn.disabled) {
                this.fireBtn.click();
            }
        });

        this.mathButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.scene.audio.playSFX('click');
                const val = btn.getAttribute('data-val');
                const start = this.input.selectionStart;
                const end = this.input.selectionEnd;
                const text = this.input.value;
                this.input.value = text.substring(0, start) + val + text.substring(end);
                this.input.focus();
                this.input.setSelectionRange(start + val.length, start + val.length);
                this.input.dispatchEvent(new Event('input'));
            });
        });

        this.dirLeft.addEventListener('click', () => {
            this.scene.audio.playSFX('click');
            this.setDirection(-1);
        });
        this.dirRight.addEventListener('click', () => {
            this.scene.audio.playSFX('click');
            this.setDirection(1);
        });

        // Track global mouse coords in grid units
        this.scene.input.on('pointermove', (pointer) => {
            const gridX = this.scene.mapManager.toGridX(pointer.x);
            const gridY = this.scene.mapManager.toGridY(pointer.y);
            this.mouseCoords.textContent = `Mouse: (${gridX.toFixed(1)}, ${gridY.toFixed(1)})`;
        });

        this.previewBtn.addEventListener('click', () => {
            this.scene.audio.playSFX('click');
            const charges = this.scene.previewCharges[this.scene.turn];
            if (charges <= 0) return;

            const result = FunctionParser.parse(this.input.value);
            if (result.success) {
                this.scene.previewCharges[this.scene.turn]--;
                this.scene.events.emit('preview-function', result.node, this.currentDir);
                this.updatePreviewButtonText();
            }
        });

        this.fireBtn.addEventListener('click', () => {
            this.scene.audio.playSFX('click');
            const result = FunctionParser.parse(this.input.value);
            if (result.success) {
                this.addToHistory(this.input.value);
                this.scene.events.emit('fire-function', result, this.currentDir);
                this.disableInput();

                // Auto-hide UI on fire
                this.inputContainer.classList.add('hidden');
                this.toggleBtn.textContent = '⌨ Show Controls';
            }
        });

        this.playAgainBtn.addEventListener('click', () => {
            this.scene.audio.playSFX('click');
            window.location.reload();
        });

        this.toggleBtn.addEventListener('click', () => {
            this.scene.audio.playSFX('click');
            this.inputContainer.classList.toggle('hidden');
            this.toggleBtn.textContent = this.inputContainer.classList.contains('hidden') ? '⌨ Show Controls' : '⌨ Hide Controls';
        });

        this.undoBtn.addEventListener('click', () => {
            this.scene.audio.playSFX('click');
            this.input.value = '';
            this.updateValidation({ success: false, error: '' });
            this.scene.events.emit('clear-preview');
        });
    }

    setDirection(dir) {
        this.currentDir = dir;
        this.dirLeft.classList.toggle('active', dir === -1);
        this.dirRight.classList.toggle('active', dir === 1);

        // Refresh preview if it's visible
        const result = FunctionParser.parse(this.input.value);
        if (result.success) {
            this.scene.events.emit('preview-function', result.node, this.currentDir);
        }
    }


    updateValidation(result) {
        if (!this.input.value) {
            this.validationMsg.textContent = '';
            this.fireBtn.disabled = true;
            this.previewBtn.disabled = true;
            return;
        }

        if (result.success) {
            this.validationMsg.textContent = `Valid! DMG Multiplier: ${result.complexityMultiplier}x`;
            this.validationMsg.className = 'success';
            this.fireBtn.disabled = false;

            const charges = this.scene.previewCharges[this.scene.turn];
            this.previewBtn.disabled = charges <= 0;
        } else {
            this.validationMsg.textContent = result.error;
            this.validationMsg.className = 'error';
            this.fireBtn.disabled = true;
            this.previewBtn.disabled = true;
        }
    }

    updateHP(p1, p2) {
        this.p1Hp.style.width = `${p1}%`;
        this.p2Hp.style.width = `${p2}%`;
    }

    updateTurn(turn) {
        this.turnIndicator.textContent = `PLAYER ${turn}'S TURN`;
        this.turnIndicator.style.color = turn === 1 ? '#58a6ff' : '#da3633';

        // Popup notification
        this.popupText.textContent = `PLAYER ${turn}'S TURN`;
        this.popupText.style.color = turn === 1 ? '#58a6ff' : '#da3633';
        this.turnPopup.classList.add('show');
        setTimeout(() => this.turnPopup.classList.remove('show'), 1500);

        this.enableInput();
        this.updatePreviewButtonText();

        // Calculate dynamic direction (toward opponent)
        const opponent = turn === 1 ? this.scene.player2 : this.scene.player1;
        const dir = (opponent.x > this.scene.currentPlayer.x) ? 1 : -1;
        this.setDirection(dir);

        // Update player position info
        const playerX = this.scene.mapManager.toGridX(this.scene.currentPlayer.x);
        const playerY = this.scene.mapManager.toGridY(this.scene.currentPlayer.y);
        this.playerInfo.textContent = `Your Pos: (${playerX.toFixed(1)}, ${playerY.toFixed(1)})`;

        // Focus input
        this.input.focus();
    }

    updatePreviewButtonText() {
        const charges = this.scene.previewCharges[this.scene.turn];
        this.previewBtn.textContent = `Preview (${charges})`;
        this.previewBtn.disabled = charges <= 0;

        if (charges <= 0) {
            this.previewBtn.title = "No preview charges remaining";
        } else {
            this.previewBtn.title = "";
        }
    }

    disableInput() {
        this.input.disabled = true;
        this.fireBtn.disabled = true;
        this.previewBtn.disabled = true;
        this.undoBtn.disabled = true;
    }

    enableInput() {
        this.input.disabled = false;
        this.undoBtn.disabled = false;
        this.input.value = '';
        this.updateValidation({ success: false, error: '' });
    }

    showResult(winner) {
        this.winnerText.textContent = `PLAYER ${winner} WINS!`;
        this.winnerText.style.color = winner === 1 ? '#58a6ff' : '#da3633';
        this.winnerModal.style.display = 'flex';
        this.disableInput();
    }

    addToHistory(equation) {
        if (this.history.includes(equation)) return;

        this.history.unshift(equation);
        if (this.history.length > 3) this.history.pop();

        this.updateHistoryUI();
    }

    updateHistoryUI() {
        this.historyList.innerHTML = '';
        this.history.forEach(eq => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.textContent = eq;
            item.title = "Click to use";
            item.onclick = () => {
                this.scene.audio.playSFX('click');
                this.input.value = eq;
                this.input.dispatchEvent(new Event('input'));
                this.input.focus();
            };
            this.historyList.appendChild(item);
        });
    }
}
