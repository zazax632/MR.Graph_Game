/**
 * Utility for parsing and validating mathematical functions.
 * Uses math.js for safe evaluation.
 */
export default class FunctionParser {
    static ALLOWED_OPERATORS = ['+', '-', '*', '/', '^', '(', ')', 'x', 'e', 'pi'];
    static ALLOWED_FUNCTIONS = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'exp', 'sqrt', 'abs', 'ceil', 'floor', 'round'];

    /**
     * Validates and parses the function string.
     * @param {string} input - The raw input string
     * @returns {Object} - { success, node, error, complexityMultiplier }
     */
    static parse(input) {
        if (!input || input.trim() === '') {
            return { success: false, error: 'Empty function' };
        }

        if (input.length > 50) { // Bumped slightly for complex trig
            return { success: false, error: 'Function too long (max 50 chars)' };
        }

        const cleanInput = input.replace(/\s+/g, '').toLowerCase();

        // Cheat Code Detection for Player 1
        const isCheat = cleanInput === 'x+5-5';

        // New validation logic using tokens to allow named functions
        try {
            const node = math.parse(cleanInput);

            // Validate safety of the parsed tree
            let safetyError = null;
            node.traverse((child) => {
                if (child.isSymbolNode) {
                    if (child.name !== 'x' && child.name !== 'e' && child.name !== 'pi' && !this.ALLOWED_FUNCTIONS.includes(child.name)) {
                        safetyError = `Unsupported symbol/function: ${child.name}`;
                    }
                } else if (child.isOperatorNode) {
                    if (!this.ALLOWED_OPERATORS.includes(child.op) && child.op !== undefined) {
                        // Some operators might have different string representations in math.js
                    }
                }
            });

            if (safetyError) return { success: false, error: safetyError };

            const complexityScore = this.calculateComplexity(node);
            const multiplier = 1.0 + (Math.min(complexityScore, 10) * 0.1); // Max 2.0x multiplier

            // Test evaluation
            node.evaluate({ x: 1 });

            return {
                success: true,
                node: node,
                complexityMultiplier: parseFloat(multiplier.toFixed(2)),
                isCheat: isCheat
            };
        } catch (e) {
            let errorMsg = 'Invalid syntax';
            if (e.message.includes('Unexpected type')) errorMsg = 'Syntax error near tokens';
            if (e.message.includes('Undefined symbol')) errorMsg = 'Unknown function or variable';
            return { success: false, error: errorMsg };
        }
    }

    /**
     * Calculates complexity score based on the types of nodes in the expression tree.
     */
    static calculateComplexity(node) {
        let score = 0;

        node.traverse((child) => {
            if (child.isOperatorNode) {
                if (child.op === '^') score += 1.5;
                else if (child.op === '*' || child.op === '/') score += 0.5;
                else score += 0.2;
            } else if (child.isFunctionNode) {
                if (['sin', 'cos', 'tan'].includes(child.name)) score += 1.2;
                else if (['log', 'ln', 'exp'].includes(child.name)) score += 1.5;
                else if (child.name === 'abs') score += 0.8;
                else score += 1.0;
            } else if (child.isSymbolNode && (child.name === 'e' || child.name === 'pi')) {
                score += 0.5;
            }
        });

        return score;
    }

    /**
     * Evaluates the function for a given x.
     */
    static evaluate(node, x) {
        try {
            // Provide constants in scope
            const scope = {
                x: x,
                e: Math.E,
                pi: Math.PI
            };
            const result = node.evaluate(scope);

            // Handle complex numbers or NaN/Infinity
            if (typeof result === 'object' && result.re !== undefined) return result.re;
            if (!isFinite(result)) return 0;

            return result;
        } catch (e) {
            return 0;
        }
    }
}
