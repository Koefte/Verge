export enum TokenType {
  NUMBER = 'NUMBER',
  IDENTIFIER = 'IDENTIFIER',
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  POWER = 'POWER',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export class Tokenizer {
  private input: string;
  private position: number;
  private currentChar: string | null;

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.currentChar = input.length > 0 ? input[0] : null;
  }

  private advance(): void {
    this.position++;
    this.currentChar = this.position < this.input.length ? this.input[this.position] : null;
  }

  private skipWhitespace(): void {
    while (this.currentChar !== null && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  private readNumber(): string {
    let number = '';
    while (this.currentChar !== null && /[0-9.]/.test(this.currentChar)) {
      number += this.currentChar;
      this.advance();
    }
    return number;
  }

  private readIdentifier(): string {
    let identifier = '';
    while (this.currentChar !== null && /[a-zA-Z_][a-zA-Z0-9_]*/.test(this.currentChar)) {
      identifier += this.currentChar;
      this.advance();
    }
    return identifier;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.currentChar !== null) {
      this.skipWhitespace();

      if (this.currentChar === null) {
        break;
      }

      const position = this.position;

      // Numbers
      if (/[0-9]/.test(this.currentChar)) {
        const value = this.readNumber();
        tokens.push({ type: TokenType.NUMBER, value, position });
        continue;
      }

      // Identifiers
      if (/[a-zA-Z_]/.test(this.currentChar)) {
        const value = this.readIdentifier();
        tokens.push({ type: TokenType.IDENTIFIER, value, position });
        continue;
      }

      // Operators
      switch (this.currentChar) {
        case '+':
          tokens.push({ type: TokenType.PLUS, value: '+', position });
          this.advance();
          break;
        case '-':
          tokens.push({ type: TokenType.MINUS, value: '-', position });
          this.advance();
          break;
        case '*':
          tokens.push({ type: TokenType.MULTIPLY, value: '*', position });
          this.advance();
          break;
        case '/':
          tokens.push({ type: TokenType.DIVIDE, value: '/', position });
          this.advance();
          break;
        case '^':
          tokens.push({ type: TokenType.POWER, value: '^', position });
          this.advance();
          break;
        case '(':
          tokens.push({ type: TokenType.LPAREN, value: '(', position });
          this.advance();
          break;
        case ')':
          tokens.push({ type: TokenType.RPAREN, value: ')', position });
          this.advance();
          break;
        default:
          throw new Error(`Unexpected character '${this.currentChar}' at position ${position}`);
      }
    }

    tokens.push({ type: TokenType.EOF, value: '', position: this.position });
    return tokens;
  }
}
