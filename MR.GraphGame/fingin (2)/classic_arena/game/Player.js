export default class Player extends Phaser.GameObjects.Container {
    constructor(scene, x, y, id, color) {
        super(scene, x, y);
        this.id = id;
        this.hp = 100;

        // Sprite
        const body = scene.add.circle(0, 0, 20, color);
        this.add(body);

        // Text
        const text = scene.add.text(0, -35, `P${id}`, {
            fontFamily: 'Outfit',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.add(text);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setCircle(20, -20, -20); // Center the physics body
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        return this.hp;
    }
}
