const app = {
    state: {
        currentPage: 'home',
        pilotName: '',
        isLoggedIn: false
    },

    init() {
        // Always show login section first as requested
        document.getElementById('login-section').style.display = 'flex';
        document.getElementById('menu-section').style.display = 'none';
        document.querySelector('.navbar').style.display = 'none';

        // Load saved name suggestion but don't auto-login
        const saved = localStorage.getItem('pilot_state');
        if (saved) {
            const data = JSON.parse(saved);
            const nameInput = document.getElementById('input-pilot-name');
            if (nameInput) nameInput.value = data.name;
        }
    },

    showPage(id) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = document.getElementById(`page-${id}`);
        if (target) {
            target.classList.add('active');
            this.state.currentPage = id;

            // Component Init Logic
            if (id === 'lab' && !this.state.labInit) {
                lab.init();
                this.state.labInit = true;
            }
            if (id === 'math' && !this.state.mathInit) {
                mathGame.init();
                this.state.mathInit = true;
            }
            if (id === 'arena') {
                // Handled by direct calls to arenaHub.loadClassic/Squad
            }
        }
    },

    login() {
        const nameInput = document.getElementById('input-pilot-name');
        const newName = nameInput.value.trim();
        if (newName) {
            const saved = localStorage.getItem('pilot_state');
            if (saved) {
                const oldData = JSON.parse(saved);
                if (oldData.name !== newName) {
                    // Name changed, clear game data
                    localStorage.removeItem('fingin_player');
                    console.log("New pilot detected. Clearing old mission data.");
                }
            }

            this.state.pilotName = newName;
            this.state.isLoggedIn = true;
            localStorage.setItem('pilot_state', JSON.stringify({ name: this.state.pilotName }));
            this.updateUI();

            // Re-init math game to load (or clear) data for the new user
            if (this.state.mathInit) {
                mathGame.init();
            }
        } else {
            alert('โปรดระบุชื่อนักบิน');
        }
    },

    updateUI() {
        if (this.state.isLoggedIn) {
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('menu-section').style.display = 'block';
            document.querySelector('.navbar').style.display = 'flex';
            document.getElementById('p-welcome-name').textContent = this.state.pilotName;
            document.getElementById('player-profile').style.display = 'block';
            document.getElementById('p-name').textContent = this.state.pilotName;
        }
    },

    startMission(type) {
        if (type === 'fingin') {
            this.showPage('math');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
