/**
 * Arena Hub Module
 * Manages the Classic Duel (Iframe) integration
 */

window.arenaHub = {
    state: {
        activeMode: 'classic'
    },

    loadClassic() {
        app.showPage('arena');
        document.getElementById('classic-arena-container').style.display = 'block';
        const frame = document.getElementById('classic-arena-frame');

        if (!frame.src || frame.src === '' || frame.src.indexOf('Function%20Duel%20Arene.html') === -1) {
            frame.src = 'classic_arena/Function Duel Arene.html';
        }
    }
};
