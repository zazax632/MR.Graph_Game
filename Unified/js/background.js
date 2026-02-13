class SpaceBackground {
    constructor() {
        this.canvas = document.getElementById('canvas-stars');
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.resize();
        this.init();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.stars = [];
        const count = 200;
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2,
                speed: Math.random() * 0.5 + 0.1,
                opacity: Math.random()
            });
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#0a1428';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.stars.forEach(s => {
            this.ctx.fillStyle = `rgba(0, 242, 255, ${s.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            this.ctx.fill();

            s.y += s.speed;
            if (s.y > this.canvas.height) {
                s.y = 0;
                s.x = Math.random() * this.canvas.width;
            }
        });

        requestAnimationFrame(() => this.draw());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const bg = new SpaceBackground();
    bg.draw();
});
