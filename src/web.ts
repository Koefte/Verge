import { Tokenizer } from './tokenizer.js';
import { Expression, Parser, BinaryExpression, NumericLiteral, PowerExpression, UnaryExpression, FunctionCall } from './parser.js';
import { converge, parseFunction, ConvergenceResult } from './converge.js';

// Re-export for use in frontend
export { converge, parseFunction, ConvergenceResult };

// Declare katex for browser
declare const katex: any;

export function expressionToLatex(expr: Expression): string {
    if (expr.type === 'NumericLiteral') {
        const num = (expr as NumericLiteral).value;
        return num.toString();
    }
    
    if (expr.type === 'Identifier') {
        return 'n';
    }
    
    if (expr.type === 'PowerExpression') {
        const powExp = expr as PowerExpression;
        const base = expressionToLatex(powExp.base);
        const exponent = expressionToLatex(powExp.exponent);
        const baseWrapped = needsParens(powExp.base, 'power') ? `(${base})` : base;
        return `{${baseWrapped}}^{${exponent}}`;
    }
    
    if (expr.type === 'UnaryExpression') {
        const u = expr as UnaryExpression;
        const inner = expressionToLatex(u.argument);
        const needs = (u.argument.type === 'BinaryExpression');
        const wrapped = needs ? `(${inner})` : inner;
        return `${u.operator}${wrapped}`;
    }

    if (expr.type === 'FunctionCall') {
        const func = expr as FunctionCall;
        const argLatex = expressionToLatex(func.argument);
        if (func.name === 'sqrt') {
            return `\\sqrt{${argLatex}}`;
        }
        if (func.name === 'sin' || func.name === 'cos') {
            return `\\${func.name}\\left(${argLatex}\\right)`;
        }
        if (func.name === 'exp') {
            // Render exp(x) as e^{x}
            return `e^{${argLatex}}`;
        }
        return `\\operatorname{${func.name}}\\left(${argLatex}\\right)`;
    }
    
    if (expr.type === 'BinaryExpression') {
        const binExp = expr as BinaryExpression;
        const left = expressionToLatex(binExp.left);
        const right = expressionToLatex(binExp.right);
        
        if (binExp.operator === '/') {
            return `\\frac{${left}}{${right}}`;
        }
        
        const leftWrapped = needsParens(binExp.left, binExp.operator) ? `(${left})` : left;
        const rightWrapped = needsParens(binExp.right, binExp.operator) ? `(${right})` : right;
        
        if (binExp.operator === '*') {
            return `${leftWrapped} \\cdot ${rightWrapped}`;
        }
        
        return `${leftWrapped} ${binExp.operator} ${rightWrapped}`;
    }
    
    return '';
}

function needsParens(expr: Expression, parentOp: string): boolean {
    if (expr.type !== 'BinaryExpression') return false;
    const binExp = expr as BinaryExpression;
    
    if (parentOp === 'power') {
        return binExp.operator === '+' || binExp.operator === '-' || 
               binExp.operator === '*' || binExp.operator === '/';
    }
    
    if (parentOp === '*' || parentOp === '/') {
        return binExp.operator === '+' || binExp.operator === '-';
    }
    
    return false;
}

export function parseExpression(input: string): Expression {
    const tokenizer = new Tokenizer(input);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    return parser.parse();
}

// Browser setup
if (typeof window !== 'undefined') {
    (window as any).ConvergenceTester = {
        parseExpression,
        converge,
        expressionToLatex
    };
}
