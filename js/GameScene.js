import MapManager from './MapManager.js';
import Player from './Player.js';
import Projectile from './Projectile.js';
import UIManager from './UIManager.js';
import GraphPreview from './GraphPreview.js';
import DamageSystem from './DamageSystem.js';
import AudioManager from './AudioManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.audio = new AudioManager(this);
        this.audio.preload();
    }

    create() {
        this.audio.init();
        this.audio.playBGM();

        this.mapManager = new MapManager(this);
        this.mapManager.drawGrid();
        this.obstacle = null;

        // Destructible Obstacles Group
        this.destructibles = this.add.group();
        this.spawnDestructibleClusters();

        // All obstacles and ground removed for pure math battle

        // Simple impact texture
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 4, 4);
        graphics.generateTexture('impact', 4, 4);

        // Players
        this.player1 = new Player(this, 0, 0, 1, 0x58a6ff);
        this.player2 = new Player(this, 0, 0, 2, 0xda3633);
        this.spawnPlayersRandomly();

        this.currentPlayer = this.player1;
        this.turn = 1;

        // State
        this.isFiring = false;
        this.projectile = null;
        this.previewCharges = { 1: 3, 2: 3 };

        // UI
        this.ui = new UIManager(this);
        this.preview = new GraphPreview(this, this.mapManager);
        this.ui.updateTurn(1); // Set initial UI state

        this.setupEvents();
    }

    setupEvents() {
        this.events.on('preview-function', (mathNode, direction) => {
            this.preview.show(mathNode, this.currentPlayer.x, this.currentPlayer.y, direction, this.currentPlayer.id === 1 ? 0x58a6ff : 0xda3633);
        });

        this.events.on('clear-preview', () => {
            this.preview.clear();
        });

        this.events.on('fire-function', (parseResult, direction) => {
            this.fire(parseResult, direction);
        });
    }

    fire(parseResult, direction) {
        if (this.isFiring) return;
        this.isFiring = true;
        this.preview.clear();

        // P1 fires Right (1), P2 fires Left (-1)
        // const direction = this.currentPlayer.id === 1 ? 1 : -1; // This is now passed as a parameter
        const color = this.currentPlayer.id === 1 ? 0x58a6ff : 0xda3633;

        this.projectile = new Projectile(
            this,
            this.currentPlayer.x,
            this.currentPlayer.y,
            parseResult.node,
            direction,
            color,
            this.mapManager
        );

        // Play fire sound
        this.audio.playSFX('fire');

        if (parseResult.isCheat && this.currentPlayer.id === 1) {
            // Player 1 Cheat: Target Player 2 and avoid obstacles
            const target = this.player2;
            const waypoints = this.findPathToTarget(this.currentPlayer, target);
            let currentWaypointIdx = 0;

            // LOCK ON UI Feedback
            const lockText = this.add.text(this.currentPlayer.x, this.currentPlayer.y - 40, "LOCK ON: P2", {
                fontSize: '16px',
                fontFamily: 'Prompt',
                fill: '#ff0000',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: { x: 5, y: 2 }
            }).setOrigin(0.5);

            this.tweens.add({
                targets: lockText,
                scale: { from: 0.5, to: 1.2 },
                alpha: { from: 1, to: 0 },
                duration: 1000,
                onComplete: () => lockText.destroy()
            });

            // Overwrite projectile movement logic for smart cheat
            this.projectile.update = function () {
                if (this.isFinished) return;
                const speed = 12; // High speed for cheat
                const wp = waypoints[currentWaypointIdx];
                const dist = Phaser.Math.Distance.Between(this.x, this.y, wp.x, wp.y);

                if (dist < speed) {
                    if (currentWaypointIdx < waypoints.length - 1) {
                        currentWaypointIdx++;
                    } else {
                        this.scene.handleHit(target, this);
                        return;
                    }
                }

                const angle = Phaser.Math.Angle.Between(this.x, this.y, wp.x, wp.y);
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;

                this.trail.lineBetween(this.x, this.y, this.x + vx, this.y + vy);
                this.x += vx;
                this.y += vy;

                // Stop only if we hit something NOT intended (though pathfinding avoids blocks)
                if (this.checkManualCollisions(this.x, this.y)) {
                    // Check if we hit the actual target or something else
                    // Projectile.checkManualCollisions handles calling handleHit if target hit
                }
            };
        }

        this.projectile.complexityMultiplier = parseResult.complexityMultiplier;

        // High-precision collision handling is done inside Projectile.update()
    }


    handleHit(player, projectile) {
        // Stop the projectile from hitting anything else or continuing
        if (!projectile.active || projectile.isFinished) return;

        // Real Graphwar logic: 100 damage = Instant death
        const damage = 100;
        player.takeDamage(damage);

        this.ui.updateHP(this.player1.hp, this.player2.hp);

        // Impact effect
        this.createImpact(projectile.x, projectile.y, projectile.fillColor);
        this.audio.playSFX('explosion');

        projectile.finish();
        this.checkGameOver();
        this.endTurn();
    }


    createImpact(x, y, color) {
        // Main Shockwave
        const shock = this.add.circle(x, y, 2, color, 0.8);
        this.tweens.add({
            targets: shock,
            radius: 40,
            alpha: 0,
            duration: 400,
            onComplete: () => shock.destroy()
        });

        const particles = this.add.particles(x, y, 'impact', {
            speed: { min: -200, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.2, end: 0 },
            blendMode: 'ADD',
            lifespan: 800,
            quantity: 30,
            emitting: false,
            tint: color
        });
        particles.explode();

        this.cameras.main.shake(200, 0.005);
        this.time.delayedCall(800, () => particles.destroy());
    }

    endTurn() {
        if (!this.isFiring) return;
        this.isFiring = false;
        this.projectile = null;

        if (this.player1.hp <= 0 || this.player2.hp <= 0) return;

        this.time.delayedCall(1000, () => {
            this.turn = this.turn === 1 ? 2 : 1;
            this.currentPlayer = this.turn === 1 ? this.player1 : this.player2;
            this.ui.updateTurn(this.turn);
        });
    }

    checkGameOver() {
        let winner = 0;
        if (this.player1.hp <= 0) winner = 2;
        else if (this.player2.hp <= 0) winner = 1;

        if (winner !== 0) {
            this.ui.showResult(winner);
            // Respawn after delay
            this.time.delayedCall(3000, () => this.resetGame());
        }
    }

    resetGame() {
        this.player1.hp = 100;
        this.player2.hp = 100;

        // Obstacle is removed
        this.obstacle = null;

        // Reset destructibles
        this.destructibles.clear(true, true);
        this.spawnDestructibleClusters();

        this.spawnPlayersRandomly();

        // Reset state
        this.turn = 1;
        this.currentPlayer = this.player1;
        this.isFiring = false;
        this.projectile = null;
        this.previewCharges = { 1: 3, 2: 3 };

        // Update UI
        this.ui.updateHP(100, 100);
        this.ui.updateTurn(1);
    }

    findPathToTarget(start, end) {
        const gridSize = 15; // Increased precision
        const margin = 80;
        const obstacleSafetyPadding = 10;

        // Define search area
        const minX = Math.min(start.x, end.x) - margin;
        const maxX = Math.max(start.x, end.x) + margin;
        const minY = Math.min(start.y, end.y) - margin;
        const maxY = Math.max(start.y, end.y) + margin;

        const startNode = {
            x: Math.round(start.x / gridSize) * gridSize,
            y: Math.round(start.y / gridSize) * gridSize,
            g: 0,
            h: Phaser.Math.Distance.Between(start.x, start.y, end.x, end.y),
            parent: null
        };

        let openList = [startNode];
        let closedList = new Set();
        const nodeToKey = (n) => `${n.x},${n.y}`;

        // Get blocked areas from ALL current destructible blocks
        const blocks = this.destructibles.getChildren().map(b => {
            const bounds = b.getBounds();
            // Slightly inflate bounds for safety
            return Phaser.Geom.Rectangle.Inflate(bounds, obstacleSafetyPadding, obstacleSafetyPadding);
        });

        let iterations = 0;
        // Limit iterations to prevent hang, but enough for complex paths
        while (openList.length > 0 && iterations < 1500) {
            iterations++;
            openList.sort((a, b) => (a.g + a.h) - (b.g + b.h));
            const current = openList.shift();

            if (Phaser.Math.Distance.Between(current.x, current.y, end.x, end.y) < gridSize * 1.5) {
                // Reconstruct path
                let path = [{ x: end.x, y: end.y }];
                let temp = current;
                while (temp.parent) {
                    path.unshift({ x: temp.x, y: temp.y });
                    temp = temp.parent;
                }
                return path;
            }

            closedList.add(nodeToKey(current));

            const neighbors = [
                { x: current.x + gridSize, y: current.y },
                { x: current.x - gridSize, y: current.y },
                { x: current.x, y: current.y + gridSize },
                { x: current.x, y: current.y - gridSize },
                // Diagonals
                { x: current.x + gridSize, y: current.y + gridSize },
                { x: current.x - gridSize, y: current.y - gridSize },
                { x: current.x + gridSize, y: current.y - gridSize },
                { x: current.x - gridSize, y: current.y + gridSize }
            ];

            for (const n of neighbors) {
                if (closedList.has(nodeToKey(n))) continue;

                // Check collision
                let isBlocked = false;
                for (const b of blocks) {
                    if (Phaser.Geom.Rectangle.Contains(b, n.x, n.y)) {
                        isBlocked = true;
                        break;
                    }
                }
                if (isBlocked) continue;

                const g = current.g + Phaser.Math.Distance.Between(current.x, current.y, n.x, n.y);
                const h = Phaser.Math.Distance.Between(n.x, n.y, end.x, end.y);

                const existing = openList.find(o => o.x === n.x && o.y === n.y);
                if (existing) {
                    if (g < existing.g) {
                        existing.g = g;
                        existing.parent = current;
                    }
                } else {
                    openList.push({ ...n, g, h, parent: current });
                }
            }
        }

        // Fallback: direct line if pathfinding fails
        return [{ x: end.x, y: end.y }];
    }

    spawnDestructibleClusters() {
        const clusterCount = 10 + Math.floor(Math.random() * 5); // 10-14 clusters
        const blockSize = 12;

        for (let i = 0; i < clusterCount; i++) {
            // Random cluster center in grid units
            const gx = -16 + Math.random() * 32;
            const gy = -8 + Math.random() * 18;

            const cx = this.mapManager.toScreenX(gx);
            const cy = this.mapManager.toScreenY(gy);

            // Create a small cluster of blocks (e.g. 4x4 or 5x5)
            const rows = 3 + Math.floor(Math.random() * 3);
            const cols = 3 + Math.floor(Math.random() * 3);

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    // Slight randomization in shape
                    if (Math.random() > 0.8) continue;

                    const x = cx + (c * blockSize);
                    const y = cy + (r * blockSize);

                    const block = this.add.rectangle(x, y, blockSize - 1, blockSize - 1, 0x8b949e);
                    this.physics.add.existing(block, true);
                    block.isDestructible = true;
                    this.destructibles.add(block);
                }
            }
        }
    }

    spawnPlayersRandomly() {
        const getSafePos = () => {
            // Tighten range for better visibility: gx [-15, 15], gy [-8, 12]
            const gx = -15 + Math.random() * 30;
            const gy = -8 + Math.random() * 20;

            const sx = this.mapManager.toScreenX(gx);
            const sy = this.mapManager.toScreenY(gy);

            return { x: sx, y: sy };
        };

        const p1Pos = getSafePos();
        this.player1.setPosition(p1Pos.x, p1Pos.y);

        let p2Pos = getSafePos();
        let attempts = 0;
        // Moderate distance: 300-600px
        while ((Phaser.Math.Distance.Between(p1Pos.x, p1Pos.y, p2Pos.x, p2Pos.y) < 250 || Phaser.Math.Distance.Between(p1Pos.x, p1Pos.y, p2Pos.x, p2Pos.y) > 700) && attempts < 50) {
            p2Pos = getSafePos();
            attempts++;
        }
        this.player2.setPosition(p2Pos.x, p2Pos.y);
    }

    update() {
        // Adaptive Zoom: keep both players in view (considering both X and Y)
        const distX = Math.abs(this.player1.x - this.player2.x);
        const distY = Math.abs(this.player1.y - this.player2.y);
        const margin = 120;

        const zoomX = (this.sys.game.config.width - margin) / Math.max(1, distX);
        const zoomY = (this.sys.game.config.height - margin) / Math.max(1, distY);

        let targetZoom = Math.min(1.2, Math.max(0.5, Math.min(zoomX, zoomY)));
        this.cameras.main.setZoom(Phaser.Math.Linear(this.cameras.main.zoom, targetZoom, 0.05));

        // Center camera between players
        const centerX = (this.player1.x + this.player2.x) / 2;
        const centerY = (this.player1.y + this.player2.y) / 2;
        this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, centerX - this.sys.game.config.width / 2, 0.05);
        this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, centerY - this.sys.game.config.height / 2, 0.05);

        // Projectile update
        if (this.projectile) {
            if (this.projectile.active) {
                this.projectile.update();
            } else {
                if (this.isFiring) this.endTurn();
                this.projectile = null;
            }
        }
    }
}
