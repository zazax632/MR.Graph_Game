/**
 * Battle Arena Module for SPACE CYBER
 * Enhanced for SQUAD-BASED MULTI-UNIT GRAPH BATTLE
 */

const arena = {
    state: {
        game: null,
        p1Units: [],
        p2Units: [],
        p1Idx: 0,
        p2Idx: 0,
        currentTurn: 1, // 1 for P1, 2 for P2
        activeUnit: null,
        isFiring: false
    },

    init() {
        if (this.state.game) return;

        const config = {
            type: Phaser.AUTO,
            parent: 'arena-root',
            width: '100%',
            height: '100%',
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            physics: {
                default: 'arcade',
                arcade: { debug: false, gravity: { y: 0 } }
            },
            scene: ArenaScene,
            backgroundColor: '#000814'
        };

        this.state.game = new Phaser.Game(config);
        this.setupPortalControls();
    },

    setupPortalControls() {
        const fireBtn = document.getElementById('fire-btn');
        const previewBtn = document.getElementById('preview-btn');
        const input = document.getElementById('function-input');

        fireBtn.addEventListener('click', () => {
            const expression = input.value.trim();
            if (!expression) return;
            this.state.game.events.emit('portal-fire', expression);
        });

        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                const expression = input.value.trim();
                if (!expression) return;
                this.state.game.events.emit('portal-preview', expression);
            });
        }

        document.querySelectorAll('.math-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                input.value += btn.dataset.val;
                input.focus();
            });
        });

        document.getElementById('undo-btn').addEventListener('click', () => {
            input.value = '';
            this.state.game.events.emit('portal-clear-preview');
        });
    },

    updateUI() {
        if (document.getElementById('p1-hp')) {
            const p1Total = this.state.p1Units.reduce((s, u) => s + u.hp, 0) / (this.state.p1Units.length || 1);
            const p2Total = this.state.p2Units.reduce((s, u) => s + u.hp, 0) / (this.state.p2Units.length || 1);

            document.getElementById('p1-hp').style.width = p1Total + '%';
            document.getElementById('p2-hp').style.width = p2Total + '%';

            const turnText = this.state.currentTurn === 1 ? 'PILOT 1 READY' : 'PILOT 2 READY';
            document.getElementById('turn-indicator').textContent = turnText;

            const msg = document.getElementById('announcement-text');
            const announcement = document.getElementById('turn-announcement');
            if (msg && announcement) {
                msg.textContent = this.state.currentTurn === 1 ? 'PILOT 1 SQUAD TURN' : 'PILOT 2 SQUAD TURN';
                announcement.style.opacity = 1;
                setTimeout(() => announcement.style.opacity = 0, 1000);
            }
        }
    }
};

class FunctionUtils {
    static parse(input) {
        if (!input || input.trim() === '') return { success: false, error: 'Empty' };
        const cleanInput = input.replace(/\s+/g, '').toLowerCase();
        const isCheat = cleanInput === 'x+5-5';
        try {
            const node = math.parse(cleanInput);
            let score = 0;
            node.traverse(child => {
                if (child.isOperatorNode) {
                    if (child.op === '^') score += 1.5;
                    else if (['*', '/'].includes(child.op)) score += 0.5;
                    else score += 0.2;
                } else if (child.isFunctionNode) {
                    if (['sin', 'cos', 'tan'].includes(child.name)) score += 1.2;
                    else score += 1.0;
                } else if (child.isSymbolNode && ['e', 'pi'].includes(child.name)) {
                    score += 0.5;
                }
            });
            const multiplier = 1.0 + (Math.min(score, 10) * 0.1);
            node.evaluate({ x: 1 });
            return { success: true, node, multiplier, isCheat };
        } catch (e) { return { success: false, error: 'Syntax Error' }; }
    }

    static evaluate(node, x) {
        try {
            const res = node.evaluate({ x: x, e: Math.E, pi: Math.PI });
            if (typeof res === 'object' && res.re !== undefined) return res.re;
            return isFinite(res) ? res : 0;
        } catch (e) { return 0; }
    }
}

class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.gridScale = 25;
        this.updateDimensions();
        this.labels = [];
    }

    updateDimensions() {
        this.width = this.scene.cameras.main.width;
        this.height = this.scene.cameras.main.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    toScreenX(gx) { return this.centerX + (gx * this.gridScale); }
    toScreenY(gy) { return this.centerY - (gy * this.gridScale); }
    toGridX(sx) { return (sx - this.centerX) / this.gridScale; }
    toGridY(sy) { return (this.centerY - sy) / this.gridScale; }

    drawGrid(graphics) {
        graphics.clear();
        this.updateDimensions();
        this.labels.forEach(l => l.destroy());
        this.labels = [];

        const rangeX = 100, rangeY = 100;
        graphics.lineStyle(1, 0x00f2ff, 0.1);

        for (let x = -rangeX; x <= rangeX; x++) {
            const sx = this.toScreenX(x);
            if (sx < 0 || sx > this.width) continue;
            graphics.moveTo(sx, 0); graphics.lineTo(sx, this.height);
            if (x !== 0 && x % 5 === 0) {
                const txt = this.scene.add.text(sx, this.centerY + 5, x, { fontSize: '10px', color: '#00f2ff' }).setAlpha(0.3).setOrigin(0.5, 0);
                this.labels.push(txt);
            }
        }

        for (let y = -rangeY; y <= rangeY; y++) {
            const sy = this.toScreenY(y);
            if (sy < 0 || sy > this.height) continue;
            graphics.moveTo(0, sy); graphics.lineTo(this.width, sy);
            if (y !== 0 && y % 5 === 0) {
                const txt = this.scene.add.text(this.centerX - 10, sy, y, { fontSize: '10px', color: '#00f2ff' }).setAlpha(0.3).setOrigin(1, 0.5);
                this.labels.push(txt);
            }
        }
        graphics.strokePath();
        graphics.lineStyle(2, 0x00f2ff, 0.4);
        graphics.moveTo(this.centerX, 0); graphics.lineTo(this.centerX, this.height);
        graphics.moveTo(0, this.centerY); graphics.lineTo(this.width, this.centerY);
        graphics.strokePath();
    }
}

class Player extends Phaser.GameObjects.Container {
    constructor(scene, x, y, team, id, color) {
        super(scene, x, y);
        this.team = team;
        this.id = id;
        this.hp = 100;
        this.color = color;

        this.bodyCircle = scene.add.circle(0, 0, 18, color);
        this.ring = scene.add.graphics();
        this.ring.lineStyle(2, 0xffffff, 0.8);
        this.ring.strokeCircle(0, 0, 22);

        this.glow = scene.add.circle(0, 0, 30, color, 0.15);
        this.activeRing = scene.add.circle(0, 0, 35, 0xffffff, 0.2).setVisible(false);

        this.add([this.glow, this.activeRing, this.bodyCircle, this.ring]);

        const text = scene.add.text(0, -40, `SQUAD ${team}-${id}`, { fontFamily: 'Orbitron', fontSize: '10px', color: '#ffffff' }).setOrigin(0.5);
        this.add(text);

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setCircle(20, -20, -20);
        this.setDepth(100);
    }

    setActive(val) {
        this.activeRing.setVisible(val);
        if (val) {
            this.scene.tweens.add({
                targets: this.activeRing,
                alpha: { from: 0.2, to: 0.5 },
                scale: { from: 1, to: 1.1 },
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        } else {
            this.scene.tweens.killTweensOf(this.activeRing);
            this.activeRing.setAlpha(0.2).setScale(1);
        }
    }

    takeDamage(a) {
        this.hp = Math.max(0, this.hp - a);
        if (this.hp <= 0) {
            this.scene.createImpact(this.x, this.y, this.color);
            this.destroy();
        }
    }
}

class ArenaScene extends Phaser.Scene {
    constructor() { super('ArenaScene'); }

    preload() {
        this.load.audio('bgm', 'https://labs.phaser.io/assets/audio/tech-no-logical.mp3');
        this.load.audio('fire', 'https://labs.phaser.io/assets/audio/SoundEffects/laser1.mp3');
        this.load.audio('explosion', 'https://labs.phaser.io/assets/audio/SoundEffects/explosion.mp3');

        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff); g.fillRect(0, 0, 4, 4);
        g.generateTexture('impact', 4, 4);
    }

    create() {
        this.mapManager = new MapManager(this);
        this.gridGraphics = this.add.graphics();
        this.mapManager.drawGrid(this.gridGraphics);

        if (!this.sound.get('bgm')) {
            this.bgm = this.sound.add('bgm', { loop: true, volume: 0.2 });
            this.bgm.play();
        }

        this.destructibles = this.add.group();
        this.spawnTerrain();
        this.spawnSquads();

        this.previewGraphics = this.add.graphics().setDepth(50);
        this.events.on('portal-fire', (expr) => this.fire(expr));
        this.events.on('portal-preview', (expr) => this.showPreview(expr));
        this.events.on('portal-clear-preview', () => this.previewGraphics.clear());

        this.scale.on('resize', this.handleResize, this);
        this.updateTurn();
    }

    spawnSquads() {
        arena.state.p1Units = [];
        arena.state.p2Units = [];

        const p1Pos = [
            { gx: -15, gy: 5 }, { gx: -12, gy: 0 }, { gx: -15, gy: -5 }
        ];
        const p2Pos = [
            { gx: 15, gy: 5 }, { gx: 12, gy: 0 }, { gx: 15, gy: -5 }
        ];

        p1Pos.forEach((p, i) => {
            const u = new Player(this, this.mapManager.toScreenX(p.gx), this.mapManager.toScreenY(p.gy), 1, i + 1, 0x00f2ff);
            arena.state.p1Units.push(u);
        });

        p2Pos.forEach((p, i) => {
            const u = new Player(this, this.mapManager.toScreenX(p.gx), this.mapManager.toScreenY(p.gy), 2, i + 1, 0xff00ff);
            arena.state.p2Units.push(u);
        });

        arena.state.currentTurn = 1;
        arena.state.p1Idx = 0;
        arena.state.p2Idx = 0;
    }

    updateTurn() {
        if (arena.state.activeUnit) arena.state.activeUnit.setActive(false);

        // Ensure units are still alive
        arena.state.p1Units = arena.state.p1Units.filter(u => u.active);
        arena.state.p2Units = arena.state.p2Units.filter(u => u.active);

        if (arena.state.p1Units.length === 0 || arena.state.p2Units.length === 0) {
            alert(arena.state.p1Units.length === 0 ? "PILOT 2 SQUAD VICTORIOUS" : "PILOT 1 SQUAD VICTORIOUS");
            this.scene.restart();
            return;
        }

        if (arena.state.currentTurn === 1) {
            if (arena.state.p1Idx >= arena.state.p1Units.length) arena.state.p1Idx = 0;
            arena.state.activeUnit = arena.state.p1Units[arena.state.p1Idx];
        } else {
            if (arena.state.p2Idx >= arena.state.p2Units.length) arena.state.p2Idx = 0;
            arena.state.activeUnit = arena.state.p2Units[arena.state.p2Idx];
        }

        arena.state.activeUnit.setActive(true);
        arena.updateUI();
    }

    handleResize() {
        this.mapManager.updateDimensions();
        this.gridGraphics.clear();
        this.mapManager.drawGrid(this.gridGraphics);
    }

    spawnTerrain() {
        for (let i = 0; i < 20; i++) {
            const gx = -20 + Math.random() * 40, gy = -10 + Math.random() * 20;
            const cx = this.mapManager.toScreenX(gx), cy = this.mapManager.toScreenY(gy);
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    if (Math.random() > 0.6) continue;
                    const b = this.add.rectangle(cx + c * 12, cy + r * 12, 11, 11, 0x8b949e);
                    this.physics.add.existing(b, true);
                    this.destructibles.add(b);
                }
            }
        }
    }

    showPreview(expr) {
        const res = FunctionUtils.parse(expr);
        if (!res.success || !arena.state.activeUnit) return;
        this.previewGraphics.clear();
        this.previewGraphics.lineStyle(2, arena.state.currentTurn === 1 ? 0x00f2ff : 0xff00ff, 0.6);

        const shooter = arena.state.activeUnit;
        const gx_start = this.mapManager.toGridX(shooter.x);
        const gy_start = this.mapManager.toGridY(shooter.y);
        const yOffset = gy_start - FunctionUtils.evaluate(res.node, gx_start);

        let gx = -30;
        let gy = FunctionUtils.evaluate(res.node, gx) + yOffset;
        this.previewGraphics.moveTo(this.mapManager.toScreenX(gx), this.mapManager.toScreenY(gy));
        while (gx < 30) {
            let lastGy = gy;
            gx += 0.2;
            gy = FunctionUtils.evaluate(res.node, gx) + yOffset;
            if (Math.abs(gy - lastGy) < 30) {
                this.previewGraphics.lineTo(this.mapManager.toScreenX(gx), this.mapManager.toScreenY(gy));
            } else {
                this.previewGraphics.moveTo(this.mapManager.toScreenX(gx), this.mapManager.toScreenY(gy));
            }
        }
        this.previewGraphics.strokePath();
    }

    fire(expr) {
        if (arena.state.isFiring || !arena.state.activeUnit) return;
        const res = FunctionUtils.parse(expr);
        if (!res.success) return;

        arena.state.isFiring = true;
        this.previewGraphics.clear();
        this.sound.play('fire', { volume: 0.5 });

        const shooter = arena.state.activeUnit;
        const dir = arena.state.currentTurn === 1 ? 1 : -1;
        const color = shooter.color;

        this.projectile = new ParityProjectile(this, shooter.x, shooter.y, res, dir, color, this.mapManager);
    }

    handleHit(target, projectile) {
        if (!projectile.active) return;
        target.takeDamage(100);
        this.createImpact(projectile.x, projectile.y, projectile.fillColor);
        this.sound.play('explosion');
        projectile.finish();

        this.time.delayedCall(1000, () => this.endTurn());
    }

    createImpact(x, y, color) {
        const shock = this.add.circle(x, y, 2, color, 0.8);
        this.tweens.add({ targets: shock, radius: 80, alpha: 0, duration: 600, onComplete: () => shock.destroy() });
        const p = this.add.particles(x, y, 'impact', { speed: { min: -250, max: 250 }, scale: { start: 0.5, end: 0 }, lifespan: 1200, quantity: 50, emitting: false, tint: color });
        p.explode();
        this.cameras.main.shake(400, 0.01);
        this.time.delayedCall(1200, () => p.destroy());
    }

    endTurn() {
        arena.state.isFiring = false;
        if (arena.state.currentTurn === 1) {
            arena.state.currentTurn = 2;
            arena.state.p1Idx++;
        } else {
            arena.state.currentTurn = 1;
            arena.state.p2Idx++;
        }
        this.updateTurn();
    }

    update() {
        const cam = this.cameras.main;
        if (arena.state.activeUnit) {
            const targetZoom = 0.6;
            cam.setZoom(Phaser.Math.Linear(cam.zoom, targetZoom, 0.05));
            cam.centerOn(
                Phaser.Math.Linear(cam.scrollX + cam.centerX, arena.state.activeUnit.x, 0.1),
                Phaser.Math.Linear(cam.scrollY + cam.centerY, arena.state.activeUnit.y, 0.1)
            );
        }
        if (this.projectile && this.projectile.active) this.projectile.update();
    }
}

class ParityProjectile extends Phaser.GameObjects.Arc {
    constructor(scene, x, y, parseRes, direction, color, mapManager) {
        super(scene, x, y, 8, 0, 360, false, color);
        scene.add.existing(this);
        this.node = parseRes.node;
        this.mapManager = mapManager;
        this.direction = direction;
        this.gridX = mapManager.toGridX(x);
        this.yOffset = mapManager.toGridY(y) - FunctionUtils.evaluate(this.node, this.gridX);
        this.trail = scene.add.graphics().setDepth(70);
        this.trail.lineStyle(3, color, 0.8);
        this.lastPos = { x, y };
        this.lastGridY = mapManager.toGridY(y);
        this.active = true;
        this.setDepth(80);
    }

    update() {
        if (!this.active) return;
        let baseStep = 0.15;
        while (baseStep > 0) {
            let subX = Math.min(baseStep, 0.05);
            let nextX = this.gridX + (subX * this.direction);
            let nextY = FunctionUtils.evaluate(this.node, nextX) + this.yOffset;
            let dY = Math.abs(nextY - this.lastGridY);

            if (dY > 30) { this.finish(); break; }
            this.gridX = nextX;
            const sx = this.mapManager.toScreenX(this.gridX), sy = this.mapManager.toScreenY(nextY);
            this.trail.lineBetween(this.lastPos.x, this.lastPos.y, sx, sy);
            this.setPosition(sx, sy);
            this.lastPos = { x: sx, y: sy };
            this.lastGridY = nextY;

            if (this.checkCollisions(sx, sy)) break;
            baseStep -= subX;
            if (sx < -2000 || sx > 3000 || sy < -2000 || sy > 3000) { this.finish(); break; }
        }
    }

    checkCollisions(sx, sy) {
        const scene = this.scene;
        const opponents = scene.state === 1 ? arena.state.p2Units : arena.state.p1Units;
        const allTargets = [...arena.state.p1Units, ...arena.state.p2Units].filter(u => u !== arena.state.activeUnit);

        for (let target of allTargets) {
            if (Phaser.Math.Distance.Between(sx, sy, target.x, target.y) < 30) {
                scene.handleHit(target, this);
                return true;
            }
        }

        let terrainHit = false;
        scene.destructibles.getChildren().forEach(b => {
            if (Phaser.Math.Distance.Between(sx, sy, b.x, b.y) < 20) { b.destroy(); terrainHit = true; }
        });
        if (terrainHit) { scene.createImpact(sx, sy, 0x8b949e); this.finish(); return true; }
        return false;
    }

    finish() {
        this.active = false;
        this.scene.tweens.add({ targets: this.trail, alpha: 0, duration: 800, onComplete: () => this.trail.destroy() });
        this.setVisible(false);
        this.scene.time.delayedCall(1200, () => this.destroy());
    }
}
