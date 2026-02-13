export default class DamageSystem {
    static BASE_DAMAGE = 20;

    /**
     * Calculates damage based on complexity and accuracy.
     * @param {number} complexityMultiplier - From FunctionParser
     * @param {boolean} directHit - Whether it was a direct hit
     * @returns {number}
     */
    static calculateDamage(complexityMultiplier, directHit) {
        const accuracy = directHit ? 1.0 : 0.5;
        return Math.round(this.BASE_DAMAGE * complexityMultiplier * accuracy);
    }
}
