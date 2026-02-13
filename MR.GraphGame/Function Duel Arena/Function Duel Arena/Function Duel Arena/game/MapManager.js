export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.width = scene.sys.game.config.width;
        this.height = scene.sys.game.config.height;

        // UNIFORM GRID SCALE (Pixels per grid unit)
        // 1 unit = 25px. This makes y=x a perfect 45 deg angle.
        this.gridScale = 25;
        this.gridScaleX = this.gridScale;
        this.gridScaleY = this.gridScale;

        this.centerX = this.width / 2;
        this.centerY = this.height / 2;

        this.graphics = scene.add.graphics();
        this.labelContainer = scene.add.container();
    }

    drawGrid() {
        this.graphics.clear();
        this.labelContainer.removeAll(true);

        // Domain roughly -20 to 20 based on screen size (800 / 25 / 2)
        const rangeX = Math.ceil(this.centerX / this.gridScale);
        const rangeY = Math.ceil(this.centerY / this.gridScale);

        this.graphics.lineStyle(1, 0x30363d, 0.5);

        // Draw vertical lines & X labels
        for (let x = -rangeX; x <= rangeX; x++) {
            const screenX = this.toScreenX(x);
            this.graphics.moveTo(screenX, 0);
            this.graphics.lineTo(screenX, this.height);

            if (x !== 0 && x % 5 === 0) {
                const label = this.scene.add.text(screenX, this.centerY + 5, x.toString(), {
                    fontSize: '12px',
                    color: '#8b949e',
                    fontFamily: 'JetBrains Mono'
                }).setOrigin(0.5, 0);
                this.labelContainer.add(label);
            }
        }

        // Draw horizontal lines & Y labels
        for (let y = -rangeY; y <= rangeY; y++) {
            const screenY = this.toScreenY(y);
            this.graphics.moveTo(0, screenY);
            this.graphics.lineTo(this.width, screenY);

            if (y !== 0 && y % 5 === 0) {
                const label = this.scene.add.text(this.centerX - 10, screenY, y.toString(), {
                    fontSize: '12px',
                    color: '#8b949e',
                    fontFamily: 'JetBrains Mono'
                }).setOrigin(1, 0.5);
                this.labelContainer.add(label);
            }
        }
        this.graphics.strokePath();

        // Draw Axes
        this.graphics.lineStyle(2, 0x58a6ff, 0.4);
        this.graphics.moveTo(this.centerX, 0);
        this.graphics.lineTo(this.centerX, this.height);
        this.graphics.moveTo(0, this.centerY);
        this.graphics.lineTo(this.width, this.centerY);
        this.graphics.strokePath();
    }

    /**
     * Converts grid X to screen X
     */
    toScreenX(gridX) {
        return this.centerX + (gridX * this.gridScaleX);
    }

    /**
     * Converts grid Y to screen Y
     * Phaser Y is down, Math Y is up, so we invert
     */
    toScreenY(gridY) {
        return this.centerY - (gridY * this.gridScaleY);
    }

    /**
     * Converts screen X to grid X
     */
    toGridX(screenX) {
        return (screenX - this.centerX) / this.gridScaleX;
    }

    /**
     * Converts screen Y to grid Y
     */
    toGridY(screenY) {
        return (this.centerY - screenY) / this.gridScaleY;
    }
}
