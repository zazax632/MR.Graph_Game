import FunctionParser from './FunctionParser.js';

export default class Projectile extends Phaser.GameObjects.Arc {
    constructor(scene, x, y, mathNode, direction, color, mapManager) {
        // Start as a small dot
        super(scene, x, y, 6, 0, 360, false, color);

        this.mathNode = mathNode;
        this.mapManager = mapManager;

        // Starting positions
        this.startX = x;
        this.startY = y;

        // Simulation parameters
        this.gridX = this.mapManager.toGridX(x);
        this.stepDir = direction; // 1 for right, -1 for left
        this.baseVelocity = 0.08; // Slower for suspense (was 0.2)

        // Trail Graphics
        this.trail = scene.add.graphics();
        this.trail.lineStyle(2.5, color, 0.7);

        // Target list for manual collision
        this.targets = [scene.player1, scene.player2];
        this.ground = null;
        this.obstacle = null;

        // Start exactly at player, but calculate offset so the rest of the graph follows the function shape
        // effective_y = f(x) + offset
        // We want py = f(px) + offset  =>  offset = py - f(px)
        const f_px = FunctionParser.evaluate(this.mathNode, this.gridX);
        const playerGridY = this.mapManager.toGridY(y);
        this.yOffset = playerGridY - f_px;

        this.lastTrailPos = { x: x, y: y };
        this.lastGridY = playerGridY;
        this.setPosition(x, y);

        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.body.setCircle(6);

        this.isFinished = false;
    }

    update() {
        if (this.isFinished) return;

        // Adaptive Numerical Integration
        // We want to travel approximately 0.2 grid units per frame total,
        // but we fragment the x-step if the y-change is too steep.
        let remainingBaseStep = this.baseVelocity;
        const maxStepY = 0.15; // Max vertical jump per sub-step

        while (remainingBaseStep > 0) {
            // Tentative sub-step
            let subX = Math.min(remainingBaseStep, 0.05); // Small enough for logic
            let nextGridX = this.gridX + (subX * this.stepDir);
            let nextGridY = FunctionParser.evaluate(this.mathNode, nextGridX) + this.yOffset;

            // Adaptive Loop: If slope is too steep, slice the subX further
            let deltaY = Math.abs(nextGridY - this.lastGridY);
            let iterations = 0;
            while (deltaY > maxStepY && iterations < 5) {
                subX /= 2;
                nextGridX = this.gridX + (subX * this.stepDir);
                nextGridY = FunctionParser.evaluate(this.mathNode, nextGridX) + this.yOffset;
                deltaY = Math.abs(nextGridY - this.lastGridY);
                iterations++;
            }

            // Apply the (potentially sliced) step
            this.gridX = nextGridX;
            const gridY = nextGridY;

            // Discontinuity Check
            if (deltaY > 20) {
                this.finish();
                break;
            }

            const screenX = this.mapManager.toScreenX(this.gridX);
            const screenY = this.mapManager.toScreenY(gridY);

            // Update trail
            this.trail.lineBetween(this.lastTrailPos.x, this.lastTrailPos.y, screenX, screenY);
            this.lastTrailPos = { x: screenX, y: screenY };
            this.lastGridY = gridY;

            // Update physical position
            this.setPosition(screenX, screenY);

            // High-Precision Collision
            if (this.checkManualCollisions(screenX, screenY)) {
                // If we hit something, we finish
                this.finish();
                break;
            }

            remainingBaseStep -= subX;

            // Boundary checks
            if (Math.abs(this.gridX) > 200 || screenX < -1000 || screenX > 2000 || screenY < -2000 || screenY > 3000) {
                this.finish();
                break;
            }
        }
    }

    checkManualCollisions(x, y) {
        // 1. Players (Circle vs Point check)
        for (const player of this.targets) {
            if (player.id === this.scene.currentPlayer.id) continue;

            const dist = Phaser.Math.Distance.Between(x, y, player.x, player.y);
            if (dist < 26) { // 20 (player radius) + 6 (proj radius)
                this.scene.handleHit(player, this);
                return true;
            }
        }        // 2. Destructible Blocks (Radial "Eating")
        let hitAny = false;
        const destructibles = this.scene.destructibles.getChildren();
        const destroyRadius = 18; // Radius to "eat" blocks

        for (let i = destructibles.length - 1; i >= 0; i--) {
            const block = destructibles[i];
            const dist = Phaser.Math.Distance.Between(x, y, block.x, block.y);

            if (dist < destroyRadius) {
                if (!hitAny) {
                    this.scene.createImpact(x, y, 0x8b949e); // One impact at point
                    hitAny = true;
                }
                block.destroy();
            }
        }

        if (hitAny) return true;


        return false;
    }

    finish() {
        if (this.isFinished) return;
        this.isFinished = true;

        // Fade out trail before destroying
        this.scene.tweens.add({
            targets: this.trail,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                this.trail.destroy();
                this.destroy();
            }
        });

        // Hide the projectile dot immediately
        this.setVisible(false);
        this.active = false;
    }

    // Override destroy to ensure trail is handled
    destroy() {
        super.destroy();
        // Trail is destroyed in the tween or here if no tween
        if (this.trail && this.trail.active && !this.isFinished) {
            this.trail.destroy();
        }
    }
}
