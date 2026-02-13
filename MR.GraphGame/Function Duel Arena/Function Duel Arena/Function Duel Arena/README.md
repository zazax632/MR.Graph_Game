# Function Duel Arena

A web-based 2D turn-based math battle game where mathematical functions become your weapons.

## 🎮 How to Play
1. **Local PvP**: Two players play on the same device.
2. **Turn-Based**: Players take turns to input mathematical functions.
3. **Attack**: 
   - Enter a function (e.g., `0.5x^2 - 3x + 2`).
   - Click **Show Preview** to see the projectile's trajectory.
   - Click **FIRE!** to launch the attack.
4. **Goal**: Reduce the opponent's HP to 0.

## 🚀 Features
- **Dynamic Physics**: Projectiles follow the exact curve of your mathematical function.
- **Damage System**: More complex functions (Quadratic, Cubic) deal more damage.
- **Validation**: Ensures functions are mathematically valid and within supported degrees.
- **Obstacles**: A central rectangle blocks projectiles, requiring creative function design to bypass.

## 🛠 Tech Stack
- **Phaser.js**: 2D Game Engine.
- **Math.js**: Safe mathematical expression parsing.
- **Vanilla ES6 JS**: Modular, clean code structure.

## 📂 Structure
- `game/`: Core game logic, entities, and physics.
- `ui/`: DOM-based UI overlay and graph previews.
- `index.html`: Main entry point with CDN imports.
- `style.css`: Modern, dark-themed styling.
- `main.js`: Phaser initialization.

## 🧪 Mathematical Details
- **Linear**: `y = ax + b` (1.0x Damage)
- **Quadratic**: `y = ax^2 + bx + c` (1.2x Damage)
- **Cubic**: `y = ax^3 + ...` (1.4x Damage)
- **Domain**: Restricted to `-20 \le x \le 20` for game balance.
