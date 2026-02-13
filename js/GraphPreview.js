import FunctionParser from './FunctionParser.js';

export default class GraphPreview {
    constructor(scene, mapManager) {
        this.scene = scene;
        this.mapManager = mapManager;
        this.graphics = scene.add.graphics();
    }

    show(mathNode, startX, startY, direction, color) {
        this.graphics.clear();
        this.graphics.lineStyle(1.5, color, 0.4);

        const playerGridX = this.mapManager.toGridX(startX);
        const playerGridY = this.mapManager.toGridY(startY);
        const f_px = FunctionParser.evaluate(mathNode, playerGridX);
        const yOffset = playerGridY - f_px;

        const startGridX = -100;
        const endGridX = 100;
        let gx = startGridX;
        const baseStep = 0.1;

        let gy = FunctionParser.evaluate(mathNode, gx) + yOffset;
        this.graphics.moveTo(this.mapManager.toScreenX(gx), this.mapManager.toScreenY(gy));

        while (gx < endGridX) {
            let lastGy = gy;
            let currentStep = baseStep;

            // Look ahead
            let nextGx = gx + currentStep;
            let nextGy = FunctionParser.evaluate(mathNode, nextGx) + yOffset;

            // Adaptive: If slope is steep, take smaller preview steps
            if (Math.abs(nextGy - lastGy) > 0.5) {
                currentStep = 0.02;
                nextGx = gx + currentStep;
                nextGy = FunctionParser.evaluate(mathNode, nextGx) + yOffset;
            }

            gx = nextGx;
            gy = nextGy;

            // Check for discontinuities to avoid drawing lines through asymptotes
            if (Math.abs(gy - lastGy) < 20) {
                this.graphics.lineTo(this.mapManager.toScreenX(gx), this.mapManager.toScreenY(gy));
            } else {
                this.graphics.moveTo(this.mapManager.toScreenX(gx), this.mapManager.toScreenY(gy));
            }
        }

        this.graphics.strokePath();
    }

    clear() {
        this.graphics.clear();
    }
}
