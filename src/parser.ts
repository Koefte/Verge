import { Token, TokenType } from "./tokenizer.js";

export interface BinaryExpression extends Expression {
    type: 'BinaryExpression';
    operator: string;
    left: Expression;
    right: Expression;
}

export interface PowerExpression extends Expression {
    type: 'PowerExpression';
    base: Expression;
    exponent: Expression;
}

export interface NumericLiteral extends Expression {
    type: 'NumericLiteral';
    value: number;
}

export interface UnaryExpression extends Expression {
    type: 'UnaryExpression';
    operator: string; // '-' or '+'
    argument: Expression;
}

interface Identifier extends Expression {
    type: 'Identifier';
    name: string;
}

export interface Expression {
    type: string;
}

export class Parser {
    private tokens: Token[];
    private current: number;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.current = 0;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private advance(): Token {
        return this.tokens[this.current++];
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    // Check if implicit multiplication is needed (e.g., 2n -> 2*n, )( -> )*(, etc.)
    private needsImplicitMultiply(): boolean {
        const current = this.peek();
        const previous = this.current > 0 ? this.tokens[this.current - 1] : null;
        
        if (!previous) return false;
        
        // Number followed by identifier: 2n -> 2*n
        if (previous.type === TokenType.NUMBER && current.type === TokenType.IDENTIFIER) {
            return true;
        }

        // Number followed by LPAREN: 2(x) -> 2*(x)
        if (previous.type === TokenType.NUMBER && current.type === TokenType.LPAREN) {
            return true;
        }

        // RPAREN followed by NUMBER: (x)2 -> (x)*2
        if (previous.type === TokenType.RPAREN && current.type === TokenType.NUMBER) {
            return true;
        }

        // RPAREN followed by IDENTIFIER: (x)n -> (x)*n
        if (previous.type === TokenType.RPAREN && current.type === TokenType.IDENTIFIER) {
            return true;
        }

        // RPAREN followed by LPAREN: (x)(y) -> (x)*(y)
        if (previous.type === TokenType.RPAREN && current.type === TokenType.LPAREN) {
            return true;
        }

        // IDENTIFIER followed by LPAREN: x(y) -> x*(y)
        if (previous.type === TokenType.IDENTIFIER && current.type === TokenType.LPAREN) {
            return true;
        }
        
        return false;
    }

    private parsePrimary(): Expression {
        const token = this.peek();

        if (token.type === TokenType.NUMBER) {
            this.advance();
            return {
                type: 'NumericLiteral',
                value: parseFloat(token.value)
            } as NumericLiteral;
        }

        if (token.type === TokenType.IDENTIFIER) {
            this.advance();
            return {
                type: 'Identifier',
                name: token.value
            } as Identifier;
        }

        if (token.type === TokenType.LPAREN) {
            this.advance(); // consume (
            const expr = this.parseExpression();
            if (this.peek().type !== TokenType.RPAREN) {
                throw new Error(`Expected ')' but got '${this.peek().value}'`);
            }
            this.advance(); // consume )
            return expr;
        }

        throw new Error(`Unexpected token type: ${token.type} at position ${token.position}`);
    }

    // Parse unary plus/minus (highest precedence)
    private parseUnary(): Expression {
        const token = this.peek();
        if (token.type === TokenType.MINUS || token.type === TokenType.PLUS) {
            const op = this.advance().value; // consume + or -
            const arg = this.parseUnary();
            // Fold immediate numeric
            if (arg.type === 'NumericLiteral') {
                const val = (arg as NumericLiteral).value;
                return {
                    type: 'NumericLiteral',
                    value: op === '-' ? -val : val
                } as NumericLiteral;
            }
            return {
                type: 'UnaryExpression',
                operator: op,
                argument: arg
            } as UnaryExpression;
        }
        return this.parsePrimary();
    }

    // Parse power expressions (right-associative, highest precedence)
    private parsePower(): Expression {
        let left = this.parseUnary();

        if (!this.isAtEnd() && this.peek().type === TokenType.POWER) {
            this.advance(); // consume ^
            const right = this.parsePower(); // right-associative
            return {
                type: 'PowerExpression',
                base: left,
                exponent: right
            } as PowerExpression;
        }

        return left;
    }

    // Parse implicit multiplication (e.g., 2n)
    private parseImplicit(): Expression {
        let left = this.parsePower();

        while (!this.isAtEnd() && this.needsImplicitMultiply()) {
            const right = this.parsePower();
            left = {
                type: 'BinaryExpression',
                operator: '*',
                left,
                right
            } as BinaryExpression;
        }

        return left;
    }

    // Parse all binary operators with equal precedence, left-associative
    private parseExpression(): Expression {
        let left = this.parseAdditive();

        while (!this.isAtEnd()) {
            const token = this.peek();

            if (token.type === TokenType.MULTIPLY || token.type === TokenType.DIVIDE) {
                const operator = this.advance().value;
                const right = this.parseAdditive();
                left = {
                    type: 'BinaryExpression',
                    operator,
                    left,
                    right
                } as BinaryExpression;
            } else {
                break;
            }
        }

        return left;
    }

    // Parse addition and subtraction (higher precedence)
    private parseAdditive(): Expression {
        let left = this.parseImplicit();

        while (!this.isAtEnd()) {
            const token = this.peek();

            if (token.type === TokenType.PLUS || token.type === TokenType.MINUS) {
                const operator = this.advance().value;
                const right = this.parseImplicit();
                left = {
                    type: 'BinaryExpression',
                    operator,
                    left,
                    right
                } as BinaryExpression;
            } else {
                break;
            }
        }

        return left;
    }

    parse(): Expression {
        return this.parseExpression();
    }
}