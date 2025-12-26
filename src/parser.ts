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

    // Check if implicit multiplication is needed (e.g., 2n -> 2*n)
    private needsImplicitMultiply(): boolean {
        const current = this.peek();
        const previous = this.current > 0 ? this.tokens[this.current - 1] : null;
        
        if (!previous) return false;
        
        // Number followed by identifier: 2n -> 2*n
        if (previous.type === TokenType.NUMBER && current.type === TokenType.IDENTIFIER) {
            return true;
        }
        
        return false;
    }

    private parsePrimary(): Expression {
        const token = this.advance();

        if (token.type === TokenType.NUMBER) {
            return {
                type: 'NumericLiteral',
                value: parseFloat(token.value)
            } as NumericLiteral;
        }

        if (token.type === TokenType.IDENTIFIER) {
            return {
                type: 'Identifier',
                name: token.value
            } as Identifier;
        }

        throw new Error(`Unexpected token type: ${token.type} at position ${token.position}`);
    }

    // Parse power expressions (right-associative, highest precedence)
    private parsePower(): Expression {
        let left = this.parsePrimary();

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