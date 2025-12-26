import { equal } from 'assert';
import { Expression, BinaryExpression, NumericLiteral, PowerExpression } from './parser.js';

export function simplify(expr: Expression): Expression {
    if (expr.type === 'PowerExpression') {
        const powExp = expr as PowerExpression;
        const base = simplify(powExp.base);
        const exponent = simplify(powExp.exponent);
        
        const isNumeric = (e: Expression, value: number): boolean => {
            return e.type === 'NumericLiteral' && (e as NumericLiteral).value === value;
        };
        
        // x^0 = 1, x^1 = x, 1^x = 1, 0^x = 0 (x > 0)
        if (isNumeric(exponent, 0)) return { type: 'NumericLiteral', value: 1 } as NumericLiteral;
        if (isNumeric(exponent, 1)) return base;
        if (isNumeric(base, 1)) return base;
        if (isNumeric(base, 0)) return base;
        
        return {
            type: 'PowerExpression',
            base,
            exponent
        } as PowerExpression;
    }
    
    if (expr.type !== 'BinaryExpression') {
        return expr;
    }

    const binExp = expr as BinaryExpression;
    const left = simplify(binExp.left);
    const right = simplify(binExp.right);

    // Helper to check if expression is a numeric literal with a specific value
    const isNumeric = (e: Expression, value: number): boolean => {
        return e.type === 'NumericLiteral' && (e as NumericLiteral).value === value;
    };

    // Addition: x + 0 = x, 0 + x = x
    if (binExp.operator === '+') {
        if (isNumeric(left, 0)) return right;
        if (isNumeric(right, 0)) return left;
    }

    // Subtraction: x - 0 = x
    if (binExp.operator === '-') {
        if (isNumeric(right, 0)) return left;
    }

    // Multiplication: x * 1 = x, 1 * x = x, x * 0 = 0, 0 * x = 0
    if (binExp.operator === '*') {
        if (isNumeric(left, 1)) return right;
        if (isNumeric(right, 1)) return left;
        if (isNumeric(left, 0)) return left;
        if (isNumeric(right, 0)) return right;
    }

    // Division: x / 1 = x
    if (binExp.operator === '/') {
        if (isNumeric(right, 1)) return left;
    }

    // If both sides are numeric, fold the operation into a single literal
    if (left.type === 'NumericLiteral' && right.type === 'NumericLiteral') {
        const a = (left as NumericLiteral).value;
        const b = (right as NumericLiteral).value;
        switch (binExp.operator) {
            case '+':
                return { type: 'NumericLiteral', value: a + b } as NumericLiteral;
            case '-':
                return { type: 'NumericLiteral', value: a - b } as NumericLiteral;
            case '*':
                return { type: 'NumericLiteral', value: a * b } as NumericLiteral;
            case '/':
                // Avoid producing invalid literals on division by zero
                if (b !== 0) {
                    return { type: 'NumericLiteral', value: a / b } as NumericLiteral;
                }
                // If dividing by zero, skip folding and return structured expression
                break;
        }
    }

    // Return simplified expression with simplified children
    return {
        type: 'BinaryExpression',
        operator: binExp.operator,
        left,
        right
    } as BinaryExpression;
}

export function degree(sequence: Expression):number{
    if(sequence.type == 'PowerExpression'){
        const powExp = sequence as PowerExpression;
        // For x^n where n is a constant, degree is n * degree(x)
        if(powExp.exponent.type == 'NumericLiteral'){
            const exp = (powExp.exponent as NumericLiteral).value;
            return exp * degree(powExp.base);
        }
        // For general case, degree is complex
        return degree(powExp.base) * degree(powExp.exponent);
    } else if(sequence.type == 'BinaryExpression'){
        const binExp = sequence as BinaryExpression;
        if(binExp.operator == '*'){
            return degree(binExp.left) + degree(binExp.right);
        } else if(binExp.operator == '/'){
            return degree(binExp.left) - degree(binExp.right);
        } else if(binExp.operator == '+'){
            return Math.max(degree(binExp.left), degree(binExp.right));
        } else if(binExp.operator == '-'){
            return Math.max(degree(binExp.left), degree(binExp.right));
        }
    } else if(sequence.type == 'Identifier'){
        return 1;
    } else if(sequence.type == 'NumericLiteral'){
        return 0;
    }
    return 0;
}

export function derive(sequence: Expression):Expression{
    if(sequence.type == 'PowerExpression'){
        const powExp = sequence as PowerExpression;
        // Power rule: (u^n)' = n * u^(n-1) * u' for constant n
        if(powExp.exponent.type == 'NumericLiteral'){
            const n = (powExp.exponent as NumericLiteral).value;
            return {
                type: 'BinaryExpression',
                operator: '*',
                left: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: { type: 'NumericLiteral', value: n } as NumericLiteral,
                    right: {
                        type: 'PowerExpression',
                        base: powExp.base,
                        exponent: { type: 'NumericLiteral', value: n - 1 } as NumericLiteral
                    } as PowerExpression
                },
                right: derive(powExp.base)
            } as BinaryExpression;
        }
        // General case: (u^v)' = u^v * (v' * ln(u) + v * u'/u)
        // For simplicity, we'll handle this as a complex derivative
        return powExp; // Placeholder
    } else if(sequence.type == 'BinaryExpression'){
        const binExp = sequence as BinaryExpression;
        if(binExp.operator == '*'){
            // Product rule: (u*v)' = u'*v + u*v'
            return {
                type: 'BinaryExpression',
                operator: '+',
                left: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: derive(binExp.left),
                    right: binExp.right
                },
                right: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: binExp.left,
                    right: derive(binExp.right)
                }
            } as BinaryExpression;
        } else if(binExp.operator == '/'){
            // Quotient rule: (u/v)' = (u'*v - u*v')/v^2
            return {
                type: 'BinaryExpression',
                operator: '/',
                left: {
                    type: 'BinaryExpression',
                    operator: '-',
                    left: {
                        type: 'BinaryExpression',
                        operator: '*',
                        left: derive(binExp.left),
                        right: binExp.right
                    },
                    right: {
                        type: 'BinaryExpression',
                        operator: '*',
                        left: binExp.left,
                        right: derive(binExp.right)
                    }
                },
                right: {
                    type: 'BinaryExpression',
                    operator: '*',
                    left: binExp.right,
                    right: binExp.right
                }
            } as BinaryExpression;
        } else if(binExp.operator == '+'){
            return {
                type: 'BinaryExpression',
                operator: '+',
                left: derive(binExp.left),
                right: derive(binExp.right)
            } as BinaryExpression;
        } else if(binExp.operator == '-'){
            return {
                type: 'BinaryExpression',
                operator: '-',
                left: derive(binExp.left),
                right: derive(binExp.right)
            } as BinaryExpression;
        }
    } else if(sequence.type == 'Identifier'){
        return {
            type: 'NumericLiteral',
            value: 1
        } as NumericLiteral;
    } else if(sequence.type == 'NumericLiteral'){
        return {
            type: 'NumericLiteral',
            value: 0
        } as NumericLiteral;
    }
    return sequence;
}

export function equals(expr1: Expression, expr2: Expression):boolean{
    if(expr1.type != expr2.type){
        return false;
    }
    if(expr1.type == 'NumericLiteral'){
        return (expr1 as NumericLiteral).value == (expr2 as NumericLiteral).value;
    }
    if(expr1.type == 'Identifier'){
        return true;
    }
    if(expr1.type == 'PowerExpression'){
        const pow1 = expr1 as PowerExpression;
        const pow2 = expr2 as PowerExpression;
        return equals(pow1.base, pow2.base) && equals(pow1.exponent, pow2.exponent);
    }
    if(expr1.type == 'BinaryExpression'){
        const bin1 = expr1 as BinaryExpression;
        const bin2 = expr2 as BinaryExpression;
        return bin1.operator == bin2.operator && equals(bin1.left, bin2.left) && equals(bin1.right, bin2.right);
    }
    return false;
}

export function converge(sequence: Expression, maxIterations: number = 10000):number|boolean{
    if(sequence.type == 'BinaryExpression'){
        const binExp = sequence as BinaryExpression;

        if(binExp.operator == '/'){
            if(degree(binExp.left) != degree(binExp.right)){
                return false;
            }
            let leftDerv = binExp.left;
            let rightDerv = binExp.right;
            let iterations = 0;
            
            while(leftDerv.type != 'NumericLiteral' && iterations < maxIterations){
                leftDerv = derive(leftDerv);
                leftDerv = simplify(leftDerv);
                iterations++;
            }
            iterations = 0;
            while(rightDerv.type != 'NumericLiteral' && iterations < maxIterations){
                rightDerv = derive(rightDerv);
                rightDerv = simplify(rightDerv);
                console.log(rightDerv);
                iterations++;
            }
            console.log("Final derivatives:", leftDerv, rightDerv);
            
            if (leftDerv.type !== 'NumericLiteral' || rightDerv.type !== 'NumericLiteral') {
                return false;
            }
            
            const leftNum = (leftDerv as NumericLiteral).value;
            const rightNum = (rightDerv as NumericLiteral).value;
            if(rightNum == 0){
                throw new Error("Division by zero in convergence");
            }
            return leftNum / rightNum;
        }

        if(binExp.operator == '*'){
            const leftConv = converge(binExp.left, maxIterations);
            const rightConv = converge(binExp.right, maxIterations);
            if(typeof leftConv == 'number' && typeof rightConv == 'number'){
                return leftConv * rightConv;
            }
            return false;
        }
        if(binExp.operator == '+'){
            const leftConv = converge(binExp.left, maxIterations);
            const rightConv = converge(binExp.right, maxIterations);
            if(typeof leftConv == 'number' && typeof rightConv == 'number'){
                return leftConv + rightConv;
            }
            return false;
        }
        if(binExp.operator == '-'){
            if(equals(binExp.left, binExp.right)){
                return 0;
            }
            const leftConv = converge(binExp.left, maxIterations);
            const rightConv = converge(binExp.right, maxIterations);
            if(typeof leftConv == 'number' && typeof rightConv == 'number'){
                return leftConv - rightConv;
            }
            return false;
        }
    }
    if(sequence.type == 'NumericLiteral'){
        return (sequence as NumericLiteral).value;
    }
    if(sequence.type == 'Identifier'){
        return false;
    }
    return false;
}