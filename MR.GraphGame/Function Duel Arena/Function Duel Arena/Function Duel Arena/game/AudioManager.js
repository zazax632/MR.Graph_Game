export default class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = new Map();
        this.bgm = null;
    }

    preload() {
        // Using highly reliable Phaser Labs assets for better CORS compatibility
        const assets = {
            'bgm': 'https://labs.phaser.io/assets/audio/tech-no-logical.mp3',
            'fire': 'https://labs.phaser.io/assets/audio/SoundEffects/laser1.mp3',
            'explosion': 'https://labs.phaser.io/assets/audio/SoundEffects/explosion.mp3',
            'click': 'https://labs.phaser.io/assets/audio/SoundEffects/p-ping.mp3'
        };

        for (const [key, url] of Object.entries(assets)) {
            this.scene.load.audio(key, url);
        }
    }

    init() {
        try {
            // Background Music - Check if key exists in cache
            if (this.scene.cache.audio.exists('bgm')) {
                this.bgm = this.scene.sound.add('bgm', { loop: true, volume: 0.2 });
            }

            // SFX - Check keys
            ['fire', 'explosion', 'click'].forEach(key => {
                if (this.scene.cache.audio.exists(key)) {
                    this.sounds.set(key, this.scene.sound.add(key, { volume: 0.5 }));
                }
            });
        } catch (e) {
            console.warn("AudioManager: Failed to initialize some sounds", e);
        }
    }

    playBGM() {
        if (this.bgm && !this.bgm.isPlaying) {
            try {
                this.bgm.play();
            } catch (e) {
                console.error("BGM failed to play:", e);
            }
        }
    }

    stopBGM() {
        if (this.bgm) this.bgm.stop();
    }

    playSFX(key) {
        const sound = this.sounds.get(key);
        if (sound) {
            try {
                sound.play();
            } catch (e) {
                console.warn(`SFX ${key} failed to play:`, e);
            }
        }
    }
}
