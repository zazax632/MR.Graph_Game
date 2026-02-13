import GameScene from './GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: [GameScene],
    backgroundColor: '#0d1117'
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
