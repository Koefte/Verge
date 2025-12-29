import { Expression, BinaryExpression, NumericLiteral, PowerExpression, UnaryExpression, FunctionCall } from './parser.js';


// Base function interface for all function types
abstract class BaseFunction {
    abstract add(other: BaseFunction): BaseFunction;
    abstract multiply(other: BaseFunction): BaseFunction;
    abstract divide(other: BaseFunction): BaseFunction;
}

class Polynomial extends BaseFunction {
    coefficients: number[]; // coefficients[i] corresponds to x^i
    constructor(coefficients: number[]) {
        super()
        // Trim trailing zeros to normalize the polynomial
        let trimmed = [...coefficients];
        while (trimmed.length > 1 && trimmed[trimmed.length - 1] === 0) {
            trimmed.pop();
        }
        this.coefficients = trimmed.length > 0 ? trimmed : [0];
    }
    add(other: BaseFunction): BaseFunction {
        if (other instanceof Polynomial) {
            const maxDegree = Math.max(this.coefficients.length, other.coefficients.length);
            const newCoeffs = new Array(maxDegree).fill(0);
            for (let i = 0; i < maxDegree; i++) {
                const a = i < this.coefficients.length ? this.coefficients[i] : 0;
                const b = i < other.coefficients.length ? other.coefficients[i] : 0;
                newCoeffs[i] = a + b;
            }
            return new Polynomial(newCoeffs);
        }
        else if (other instanceof RationalFunction) {
            const ac = this.multiply(other.denominator);
            const newNumerator = ac.add(other.numerator);
            return new RationalFunction(newNumerator, other.denominator);
        }
        else {
            return new AddFunction(this, other);
        }
    }
    multiply(other: BaseFunction): BaseFunction {
        if (other instanceof Polynomial) {
            const newDegree = this.coefficients.length + other.coefficients.length - 1;
            const newCoeffs = new Array(newDegree).fill(0);
            for (let i = 0; i < this.coefficients.length; i++) {
                for (let j = 0; j < other.coefficients.length; j++) {
                    newCoeffs[i + j] += this.coefficients[i] * other.coefficients[j];
                }
            }
            return new Polynomial(newCoeffs);
        
        }
        else if (other instanceof RationalFunction){
            const newNumerator = this.multiply(other.numerator);
            return new RationalFunction(newNumerator, other.denominator);
        }
        else {
            return new MultiplyFunction(this, other);
        }
    }
    divide(other: BaseFunction): BaseFunction {
        if (other instanceof Polynomial) {
            return new RationalFunction(this, other);
        }
        else if (other instanceof RationalFunction) {
            // (A) / (C/D) = (A*D) / C
            return new RationalFunction(this.multiply(other.denominator), other.numerator);
        }
        else {
            return new DivideFunction(this, other);
        }
    }
}

class RationalFunction extends BaseFunction {
    numerator: BaseFunction;
    denominator: BaseFunction;
    constructor(numerator: BaseFunction, denominator: BaseFunction) {
        super()
        this.numerator = numerator;
        this.denominator = denominator;
    }
    add(other: BaseFunction): BaseFunction {
        // (A/B) + (C/D) = (AD + BC) / BD
        if(other instanceof RationalFunction){
            const ad  = this.numerator.multiply(other.denominator);
            const bc = this.denominator.multiply(other.numerator);
            const bd = this.denominator.multiply(other.denominator);
            const newNumerator = ad.add(bc);
            return new RationalFunction(newNumerator, bd);
        } else if (other instanceof Polynomial) {
            // (A/B) + C = (A + BC) / B
            const bc = this.denominator.multiply(other);
            const newNumerator = this.numerator.add(bc);
            return new RationalFunction(newNumerator, this.denominator);
        }
        else {
            // (A/B) + F = (A + B*F) / B
            const bf = this.denominator.multiply(other);
            const newNumerator = this.numerator.add(bf);
            return new RationalFunction(newNumerator, this.denominator);
        }
    }
    multiply(other: BaseFunction): BaseFunction {
        // (A/B) * (C/D) = (AC) / (BD)
        if(other instanceof RationalFunction){
            const ac = this.numerator.multiply(other.numerator);
            const bd = this.denominator.multiply(other.denominator);
            return new RationalFunction(ac, bd);
        } else if (other instanceof Polynomial) {
            // (A/B) * C = (AC) / B
            const ac = this.numerator.multiply(other);
            return new RationalFunction(ac, this.denominator);
        }
        else {
            // (A/B) * F = (A*F) / B
            const af = this.numerator.multiply(other);
            return new RationalFunction(af, this.denominator);
        }
    }
    divide(other: BaseFunction): BaseFunction {
        // (A/B) / X = (A) / (B*X)
        return new RationalFunction(this.numerator, this.denominator.multiply(other));
    }
}

// Composite function classes for operations
class AddFunction extends BaseFunction {
    left: BaseFunction;
    right: BaseFunction;
    constructor(left: BaseFunction, right: BaseFunction) {
        super();
        this.left = left;
        this.right = right;
    }
    add(other: BaseFunction): BaseFunction {
        return new AddFunction(this, other);
    }
    multiply(other: BaseFunction): BaseFunction {
        return new MultiplyFunction(this, other);
    }
    divide(other: BaseFunction): BaseFunction {
        return new DivideFunction(this, other);
    }
}

class MultiplyFunction extends BaseFunction {
    left: BaseFunction;
    right: BaseFunction;
    constructor(left: BaseFunction, right: BaseFunction) {
        super();
        this.left = left;
        this.right = right;
    }
    add(other: BaseFunction): BaseFunction {
        return new AddFunction(this, other);
    }
    multiply(other: BaseFunction): BaseFunction {
        return new MultiplyFunction(this, other);
    }
    divide(other: BaseFunction): BaseFunction {
        return new DivideFunction(this, other);
    }
}

class DivideFunction extends BaseFunction {
    numerator: BaseFunction;
    denominator: BaseFunction;
    constructor(numerator: BaseFunction, denominator: BaseFunction) {
        super();
        this.numerator = numerator;
        this.denominator = denominator;
    }
    add(other: BaseFunction): BaseFunction {
        return new AddFunction(this, other);
    }
    multiply(other: BaseFunction): BaseFunction {
        return new MultiplyFunction(this, other);
    }
    divide(other: BaseFunction): BaseFunction {
        return new DivideFunction(this, other);
    }
}

// Transcendental function classes
class SinFunction extends BaseFunction {
    argument: BaseFunction;
    constructor(argument: BaseFunction) {
        super();
        this.argument = argument;
    }
    add(other: BaseFunction): BaseFunction {
        return new AddFunction(this, other);
    }
    multiply(other: BaseFunction): BaseFunction {
        return new MultiplyFunction(this, other);
    }
    divide(other: BaseFunction): BaseFunction {
        return new DivideFunction(this, other);
    }
}

class CosFunction extends BaseFunction {
    argument: BaseFunction;
    constructor(argument: BaseFunction) {
        super();
        this.argument = argument;
    }
    add(other: BaseFunction): BaseFunction {
        return new AddFunction(this, other);
    }
    multiply(other: BaseFunction): BaseFunction {
        return new MultiplyFunction(this, other);
    }
    divide(other: BaseFunction): BaseFunction {
        return new DivideFunction(this, other);
    }
}

class TanFunction extends BaseFunction {
    argument: BaseFunction;
    constructor(argument: BaseFunction) {
        super();
        this.argument = argument;
    }
    add(other: BaseFunction): BaseFunction {
        return new AddFunction(this, other);
    }
    multiply(other: BaseFunction): BaseFunction {
        return new MultiplyFunction(this, other);
    }
    divide(other: BaseFunction): BaseFunction {
        return new DivideFunction(this, other);
    }
}

class LogFunction extends BaseFunction {
    argument: BaseFunction;
    base: number; // logarithm base (default 10)
    constructor(argument: BaseFunction, base: number = 10) {
        super();
        this.argument = argument;
        this.base = base;
    }
    add(other: BaseFunction): BaseFunction {
        return new AddFunction(this, other);
    }
    multiply(other: BaseFunction): BaseFunction {
        return new MultiplyFunction(this, other);
    }
    divide(other: BaseFunction): BaseFunction {
        return new DivideFunction(this, other);
    }
}

class LnFunction extends BaseFunction {
    argument: BaseFunction;
    constructor(argument: BaseFunction) {
        super();
        this.argument = argument;
    }
    add(other: BaseFunction): BaseFunction {
        return new AddFunction(this, other);
    }
    multiply(other: BaseFunction): BaseFunction {
        return new MultiplyFunction(this, other);
    }
    divide(other: BaseFunction): BaseFunction {
        return new DivideFunction(this, other);
    }
}

class SqrtFunction extends BaseFunction {
    argument: BaseFunction;
    constructor(argument: BaseFunction) {
        super();
        this.argument = argument;
    }
    add(other: BaseFunction): BaseFunction {
        return new AddFunction(this, other);
    }
    multiply(other: BaseFunction): BaseFunction {
        return new MultiplyFunction(this, other);
    }
    divide(other: BaseFunction): BaseFunction {
        return new DivideFunction(this, other);
    }
}

class EExpFunction extends BaseFunction {
    argument: BaseFunction;
    constructor(argument: BaseFunction) {
        super();
        this.argument = argument;
    }
    add(other: BaseFunction): BaseFunction {
        return new AddFunction(this, other);
    }
    multiply(other: BaseFunction): BaseFunction {
        return new MultiplyFunction(this, other);
    }
    divide(other: BaseFunction): BaseFunction {
        return new DivideFunction(this, other);
    }
}

class ConstantBaseExpFunction extends BaseFunction {
    base: number;  // The constant base (e.g., 2 in 2^n)
    exponent: BaseFunction;  // The exponent function (e.g., n, n+1, 2n)
    constructor(base: number, exponent: BaseFunction) {
        super();
        this.base = base;
        this.exponent = exponent;
    }
    add(other: BaseFunction): BaseFunction {
        return new AddFunction(this, other);
    }
    multiply(other: BaseFunction): BaseFunction {
        // b1^f * b2^g: if bases are equal and exponents can be added, combine them
        if(other instanceof ConstantBaseExpFunction && this.base === other.base){
            // b^f * b^g = b^(f+g)
            return new ConstantBaseExpFunction(this.base, this.exponent.add(other.exponent));
        }
        return new MultiplyFunction(this, other);
    }
    divide(other: BaseFunction): BaseFunction {
        // b1^f / b2^g
        if(other instanceof ConstantBaseExpFunction){
            // Check if exponents are the same (or proportional)
            const thisExpConv = converge(this.exponent);
            const otherExpConv = converge(other.exponent);
            
            // If both exponents have same behavior, we can combine
            // (b1/b2)^f
            if(this.base === other.base){
                // b^f / b^g = b^(f-g)
                const negatedExp = other.exponent.multiply(new Polynomial([-1]));
                return new ConstantBaseExpFunction(this.base, this.exponent.add(negatedExp));
            } else if(thisExpConv.converges && otherExpConv.converges && 
                      thisExpConv.limit === otherExpConv.limit){
                // Both converge to same exponent: (b1/b2)^k where k is constant
                return new ConstantBaseExpFunction(this.base / other.base, this.exponent);
            } else if(!thisExpConv.converges && !otherExpConv.converges &&
                      thisExpConv.divergeTo === otherExpConv.divergeTo){
                // Both diverge the same way, combine bases
                return new ConstantBaseExpFunction(this.base / other.base, this.exponent);
            }
        }
        return new DivideFunction(this, other);
    }
}


export class ConvergenceResult {
    converges: boolean = false;
    limit?: number;
    divergeTo?: number; // +Infinity or -Infinity
    growthKind?: GrowthKind;
    converge(limit:number,growthKind:GrowthKind):this{
        this.converges = true;
        this.limit = limit;
        this.growthKind = growthKind;
        return this;
    }
    diverge(divergeTo:number,growthKind:GrowthKind):this{
        this.converges = false;
        this.divergeTo = divergeTo;
        this.growthKind = growthKind;
        return this;
    }
    divergeIndeterminant():this{
        this.converges = false;
        return this;
    }
}

export enum GrowthKind {
    Exponential,
    Polynomial,
    Logarithmic
}


export function parseFunction(expr: Expression): BaseFunction {
    if(expr.type == 'BinaryExpression'){
        let binExp = expr as BinaryExpression;
        if(binExp.operator == '/'){
            let numerator = parseFunction(binExp.left);
            let denominator = parseFunction(binExp.right);
            return numerator.divide(denominator);
            
        }
        if(binExp.operator == '+'){
            let left = parseFunction(binExp.left);
            let right = parseFunction(binExp.right);
            return left.add(right)
        }
        if(binExp.operator == '-'){
            let left = parseFunction(binExp.left);
            let right = parseFunction(binExp.right);
            return left.add(right.multiply(new Polynomial([-1])));
        }
        if(binExp.operator == '*'){
            let left = parseFunction(binExp.left);
            let right = parseFunction(binExp.right);
            return left.multiply(right);
        }
    }
    if(expr.type == 'UnaryExpression'){
        const u = expr as UnaryExpression;
        const argFunc = parseFunction(u.argument);
        if(u.operator == '-'){
            return argFunc.multiply(new Polynomial([-1]));
        }
        return argFunc;
    }
    if(expr.type == 'PowerExpression'){
        const powExp = expr as PowerExpression;
        
        // Check if base is a constant (NumericLiteral) and exponent contains n
        if(powExp.base.type == 'NumericLiteral'){
            const baseValue = (powExp.base as NumericLiteral).value;
            const exponentFunc = parseFunction(powExp.exponent);
            // This is b^n where b is constant
            return new ConstantBaseExpFunction(baseValue, exponentFunc);
        }
        
        // Try to evaluate base as a constant
        const baseFunc = parseFunction(powExp.base);
        
        // Check if base is a constant polynomial
        if(baseFunc instanceof Polynomial && baseFunc.coefficients.length === 1){
            const baseValue = baseFunc.coefficients[0];
            const exponentFunc = parseFunction(powExp.exponent);
            return new ConstantBaseExpFunction(baseValue, exponentFunc);
        }
        
        // Check if base is a rational that evaluates to a constant
        if(baseFunc instanceof RationalFunction){
            const baseConverge = converge(baseFunc);
            if(baseConverge.converges && baseConverge.limit !== undefined){
                const exponentFunc = parseFunction(powExp.exponent);
                return new ConstantBaseExpFunction(baseConverge.limit, exponentFunc);
            }
        }
        
        if(powExp.exponent.type == 'NumericLiteral'){
            const expValue = (powExp.exponent as NumericLiteral).value;
            let result: BaseFunction = new Polynomial([1]);
            if(expValue >= 0){
                for(let i=0; i<expValue; i++){
                    result = result.multiply(baseFunc);
                }
                return result;
            } else {
                // Handle negative exponents: n^-k = 1 / n^k
                for(let i=0; i<Math.abs(expValue); i++){
                    result = result.multiply(baseFunc);
                }
                return new Polynomial([1]).divide(result);
            }
        }
        throw new Error("Unsupported exponent type in power expression for function parsing");
    }
    if(expr.type == 'NumericLiteral'){
        const numLit = expr as NumericLiteral;
        return new Polynomial([numLit.value]);
    }
    if(expr.type == 'Identifier'){
        // 'n' corresponds to x^1
        return new Polynomial([0, 1]);
    }
    if(expr.type == 'FunctionCall'){
        const funcCall = expr as FunctionCall;
        const argument = parseFunction(funcCall.argument);
        switch(funcCall.name.toLowerCase()){
            case 'sin':
                return new SinFunction(argument);
            case 'cos':
                return new CosFunction(argument);
            case 'tan':
                return new TanFunction(argument);
            case 'log':
                return new LogFunction(argument, 10);
            case 'log10':
                return new LogFunction(argument, 10);
            case 'log2':
                return new LogFunction(argument, 2);
            case 'ln':
            case 'log_e':
                return new LnFunction(argument);
            case 'sqrt':
            case 'sqrt2':
                return new SqrtFunction(argument);
            case 'exp':
            case 'e^':
                return new EExpFunction(argument);
            case 'abs':
                // For now, treat absolute value as identity (may need special handling)
                return argument;
            default:
                throw new Error(`Unsupported function: ${funcCall.name}`);
        }
    }
    throw new Error("Unsupported expression for function parsing");
}

export function converge(func: BaseFunction): ConvergenceResult {
    if(func instanceof RationalFunction){
       if(func.numerator instanceof Polynomial && func.denominator instanceof Polynomial){
            const numDegree = func.numerator.coefficients.length - 1;
            const denDegree = func.denominator.coefficients.length - 1;
            if(numDegree < denDegree){
                return new ConvergenceResult().converge(0,GrowthKind.Polynomial);
            }
            if(numDegree == denDegree){
                const numLeadingCoeff = func.numerator.coefficients[numDegree];
                const denLeadingCoeff = func.denominator.coefficients[denDegree];
                return new ConvergenceResult().converge(numLeadingCoeff / denLeadingCoeff,GrowthKind.Polynomial);
            }
            if(numDegree > denDegree){
                return new ConvergenceResult().diverge(Infinity * Math.sign(func.numerator.coefficients[numDegree] / func.denominator.coefficients[denDegree]),GrowthKind.Polynomial);
            }
       }
       if(func.numerator instanceof RationalFunction || func.denominator instanceof RationalFunction){
            const numeratorLimit = converge(func.numerator);
            const denominatorLimit = converge(func.denominator);
            
            // Handle cases based on convergence behavior
            if (numeratorLimit.converges && denominatorLimit.converges) {
                // Both converge to finite values
                if (denominatorLimit.limit === 0) {
                    // 0/0 or finite/0 - need more sophisticated analysis
                    return new ConvergenceResult().divergeIndeterminant();
                }
                return new ConvergenceResult().converge(
                    numeratorLimit.limit! / denominatorLimit.limit!,
                    GrowthKind.Polynomial
                );
            }
            
            if (numeratorLimit.converges && !denominatorLimit.converges) {
                // Numerator converges to finite, denominator diverges
                if (denominatorLimit.divergeTo !== undefined) {
                    // Finite / Infinity = 0
                    return new ConvergenceResult().converge(0, GrowthKind.Polynomial);
                }
                // Denominator is indeterminate (oscillating)
                return new ConvergenceResult().divergeIndeterminant();
            }
            
            if (!numeratorLimit.converges && denominatorLimit.converges) {
                // Numerator diverges, denominator converges to finite
                if (denominatorLimit.limit === 0) {
                    return new ConvergenceResult().divergeIndeterminant();
                }
                if (numeratorLimit.divergeTo !== undefined) {
                    // Infinity / Finite = Infinity
                    return new ConvergenceResult().diverge(
                        numeratorLimit.divergeTo,
                        numeratorLimit.growthKind ?? GrowthKind.Polynomial
                    );
                }
                // Numerator is indeterminate
                return new ConvergenceResult().divergeIndeterminant();
            }
            
            // Both don't converge
            return new ConvergenceResult().divergeIndeterminant();
       }
       throw new Error("Failed to evaluate limt of rational function");
    }
    if(func instanceof Polynomial){
        const degree = func.coefficients.length - 1;
        if(degree <= 0){
            return new ConvergenceResult().converge(func.coefficients[0],GrowthKind.Polynomial); 
        }
        if(degree > 0){
            return new ConvergenceResult().diverge(Infinity * Math.sign(func.coefficients[degree]),GrowthKind.Polynomial);
        }
    }
    if(func instanceof ConstantBaseExpFunction){
        // Handle b^n where b is a constant
        const base = func.base;
        const exponentConverge = converge(func.exponent);
        
        // If exponent converges to a finite value
        if(exponentConverge.converges && exponentConverge.limit !== undefined){
            return new ConvergenceResult().converge(
                Math.pow(base, exponentConverge.limit),
                GrowthKind.Exponential
            );
        }
        
        // If exponent diverges to infinity
        if(!exponentConverge.converges && exponentConverge.divergeTo !== undefined){
            const absBase = Math.abs(base);
            
            if(exponentConverge.divergeTo === Infinity){
                if(absBase > 1){
                    // b^n diverges to infinity if |b| > 1
                    const sign = base > 0 ? 1 : (base < 0 ? NaN : 0); // negative base with large n is complex
                    if(base < 0){
                        // Negative base with n->infinity oscillates
                        return new ConvergenceResult().divergeIndeterminant();
                    }
                    return new ConvergenceResult().diverge(Infinity, GrowthKind.Exponential);
                } else if(absBase === 1){
                    if(base === 1){
                        return new ConvergenceResult().converge(1, GrowthKind.Exponential);
                    } else { // base === -1
                        // (-1)^n oscillates between -1 and 1
                        return new ConvergenceResult().divergeIndeterminant();
                    }
                } else { // 0 < |b| < 1
                    // b^n converges to 0 if |b| < 1
                    return new ConvergenceResult().converge(0, GrowthKind.Exponential);
                }
            } else if(exponentConverge.divergeTo === -Infinity){
                if(absBase > 1){
                    // b^(-infinity) = 0 if |b| > 1
                    return new ConvergenceResult().converge(0, GrowthKind.Exponential);
                } else if(absBase === 1){
                    if(base === 1){
                        return new ConvergenceResult().converge(1, GrowthKind.Exponential);
                    } else { // base === -1
                        return new ConvergenceResult().divergeIndeterminant();
                    }
                } else { // 0 < |b| < 1
                    // b^(-infinity) diverges to infinity if 0 < |b| < 1
                    return new ConvergenceResult().diverge(Infinity, GrowthKind.Exponential);
                }
            }
        }
        
        // Exponent is indeterminate
        return new ConvergenceResult().divergeIndeterminant();
    }
    if(func instanceof EExpFunction || func instanceof LogFunction || func instanceof LnFunction || func instanceof SinFunction || func instanceof CosFunction || func instanceof TanFunction || func instanceof SqrtFunction){
        // these are all continous functions
        const argConverge = converge(func.argument);
        if(argConverge.converges === false && !argConverge.divergeTo){
            return new ConvergenceResult().divergeIndeterminant();
        }
        if (argConverge.converges) {
            if(func instanceof EExpFunction){
                return new ConvergenceResult().converge(Math.E ** argConverge.limit!,GrowthKind.Exponential);
            }
            if(func instanceof LogFunction){
                // use ln formula change of base
                const logValue = Math.log(argConverge.limit!) / Math.log((func as LogFunction).base);
                if(!isFinite(logValue)){
                    if(logValue === -Infinity){
                        return new ConvergenceResult().diverge(-Infinity, GrowthKind.Logarithmic);
                    }
                    return new ConvergenceResult().diverge(Infinity, GrowthKind.Logarithmic);
                }
                return new ConvergenceResult().converge(
                    logValue,
                    GrowthKind.Logarithmic
                );
            }
            if(func instanceof LnFunction){
                const logValue = Math.log(argConverge.limit!);
                if(!isFinite(logValue)){
                    if(logValue === -Infinity){
                        return new ConvergenceResult().diverge(-Infinity, GrowthKind.Logarithmic);
                    }
                    return new ConvergenceResult().diverge(Infinity, GrowthKind.Logarithmic);
                }
                return new ConvergenceResult().converge(
                    logValue,
                    GrowthKind.Logarithmic
                );
            }
            if(func instanceof SinFunction){
                return new ConvergenceResult().converge(
                    Math.sin(argConverge.limit!),
                    GrowthKind.Polynomial
                );
            }
            if(func instanceof CosFunction){
                return new ConvergenceResult().converge(
                    Math.cos(argConverge.limit!),
                    GrowthKind.Polynomial
                );
            }
            if(func instanceof SqrtFunction){
                if(argConverge.limit! >= 0){
                    return new ConvergenceResult().converge(
                        Math.sqrt(argConverge.limit!),
                        GrowthKind.Polynomial
                    );
                } else {
                    // sqrt of negative number
                    return new ConvergenceResult().divergeIndeterminant();
                }
            }
        }
        if(argConverge.divergeTo !== undefined){
            if(func instanceof EExpFunction){
                if(argConverge.divergeTo > 0){
                    return new ConvergenceResult().diverge(Infinity,GrowthKind.Exponential);
                } else {
                    return new ConvergenceResult().converge(0,GrowthKind.Exponential);
                }
            }
            else if(func instanceof LnFunction || func instanceof LogFunction){
                if(argConverge.divergeTo > 0){
                    return new ConvergenceResult().diverge(Infinity,GrowthKind.Logarithmic);
                } else {
                    return new ConvergenceResult().divergeIndeterminant();
                }
            }
            else if(func instanceof SinFunction || func instanceof CosFunction){
                return new ConvergenceResult().divergeIndeterminant();
            }
            else if(func instanceof SqrtFunction){
                if(argConverge.divergeTo > 0){
                    // sqrt(infinity) = infinity
                    return new ConvergenceResult().diverge(Infinity, GrowthKind.Polynomial);
                } else {
                    return new ConvergenceResult().divergeIndeterminant();
                }
            }
        }
        if(func instanceof TanFunction){
            throw new Error("Convergence of tangent function not supported");
        }
    }
    if(func instanceof AddFunction){
        let leftConverge = converge(func.left);
        let rightConverge = converge(func.right);
        
        // Both converge to finite values
        if(leftConverge.converges && rightConverge.converges){
            return new ConvergenceResult().converge(
                leftConverge.limit! + rightConverge.limit!,
                GrowthKind.Polynomial
            );
        }
        
        // One converges, one diverges - the diverging one dominates
        if(leftConverge.converges && !rightConverge.converges){
            if(rightConverge.divergeTo !== undefined){
                return new ConvergenceResult().diverge(
                    rightConverge.divergeTo,
                    rightConverge.growthKind ?? GrowthKind.Polynomial
                );
            }
            // Right oscillates - indeterminate
            return new ConvergenceResult().divergeIndeterminant();
        }
        if(rightConverge.converges && !leftConverge.converges){
            if(leftConverge.divergeTo !== undefined){
                return new ConvergenceResult().diverge(
                    leftConverge.divergeTo,
                    leftConverge.growthKind ?? GrowthKind.Polynomial
                );
            }
            return new ConvergenceResult().divergeIndeterminant();
        }
        
        // Both diverge
        if(!leftConverge.converges && !rightConverge.converges){
            if(leftConverge.divergeTo !== undefined && rightConverge.divergeTo !== undefined){
                // Compare growth rates - faster one dominates
                const leftGrowth = leftConverge.growthKind ?? GrowthKind.Polynomial;
                const rightGrowth = rightConverge.growthKind ?? GrowthKind.Polynomial;
                
                if(leftGrowth < rightGrowth){
                    // Left grows faster (lower number = faster)
                    return new ConvergenceResult().diverge(leftConverge.divergeTo, leftGrowth);
                } else if(rightGrowth < leftGrowth){
                    // Right grows faster
                    return new ConvergenceResult().diverge(rightConverge.divergeTo, rightGrowth);
                } else {
                    // Same growth rate - need to add them
                    if(Math.sign(leftConverge.divergeTo) === Math.sign(rightConverge.divergeTo)){
                        return new ConvergenceResult().diverge(leftConverge.divergeTo, leftGrowth);
                    } else {
                        // Opposite infinities - indeterminate
                        return new ConvergenceResult().divergeIndeterminant();
                    }
                }
            }
        }
        
        return new ConvergenceResult().divergeIndeterminant();
    }
    if(func instanceof MultiplyFunction){
        let leftConverge = converge(func.left);
        let rightConverge = converge(func.right);
        
        // Both converge to finite values
        if(leftConverge.converges && rightConverge.converges){
            return new ConvergenceResult().converge(
                leftConverge.limit! * rightConverge.limit!,
                GrowthKind.Polynomial
            );
        }
        
        // One converges to 0, other diverges (but bounded) -> 0
        if(leftConverge.converges && leftConverge.limit === 0 && !rightConverge.converges){
            if(rightConverge.divergeTo === undefined){
                // Left is 0, right oscillates (bounded) -> product goes to 0
                return new ConvergenceResult().converge(0, GrowthKind.Polynomial);
            }
        }
        if(rightConverge.converges && rightConverge.limit === 0 && !leftConverge.converges){
            if(leftConverge.divergeTo === undefined){
                return new ConvergenceResult().converge(0, GrowthKind.Polynomial);
            }
        }
        
        // One diverges, one converges to non-zero finite value
        if(leftConverge.converges && !rightConverge.converges && rightConverge.divergeTo !== undefined){
            if(leftConverge.limit === 0){
                // 0 * infinity indeterminate (but in limit context, if one is exponential decay...)
                return new ConvergenceResult().divergeIndeterminant();
            }
            const sign = Math.sign(leftConverge.limit!) * Math.sign(rightConverge.divergeTo);
            return new ConvergenceResult().diverge(sign * Infinity, rightConverge.growthKind ?? GrowthKind.Polynomial);
        }
        if(rightConverge.converges && !leftConverge.converges && leftConverge.divergeTo !== undefined){
            if(rightConverge.limit === 0){
                return new ConvergenceResult().divergeIndeterminant();
            }
            const sign = Math.sign(rightConverge.limit!) * Math.sign(leftConverge.divergeTo);
            return new ConvergenceResult().diverge(sign * Infinity, leftConverge.growthKind ?? GrowthKind.Polynomial);
        }
        
        // Both diverge - depends on growth rates
        if(!leftConverge.converges && !rightConverge.converges){
            if(leftConverge.divergeTo !== undefined && rightConverge.divergeTo !== undefined){
                const sign = Math.sign(leftConverge.divergeTo) * Math.sign(rightConverge.divergeTo);
                // Combine growth kinds (take the faster one)
                const growthKind = Math.min(
                    leftConverge.growthKind ?? GrowthKind.Polynomial,
                    rightConverge.growthKind ?? GrowthKind.Polynomial
                );
                return new ConvergenceResult().diverge(sign * Infinity, growthKind);
            }
        }
        
        return new ConvergenceResult().divergeIndeterminant();
    }
    if(func instanceof DivideFunction){
        let numeratorConverge = converge(func.numerator);
        let denominatorConverge = converge(func.denominator);
        
        // Case 1: Both converge to finite values
        if (numeratorConverge.converges && denominatorConverge.converges) {
            if (denominatorConverge.limit === 0) {
                // Division by zero limit
                return new ConvergenceResult().divergeIndeterminant();
            }
            return new ConvergenceResult().converge(
                numeratorConverge.limit! / denominatorConverge.limit!,
                GrowthKind.Polynomial
            );
        }
        
        // Case 2: Numerator converges to finite value, denominator diverges
        if (numeratorConverge.converges && !denominatorConverge.converges) {
            if (denominatorConverge.divergeTo !== undefined) {
                // Finite / Infinity = 0
                return new ConvergenceResult().converge(0, GrowthKind.Polynomial);
            }
            // Numerator converges, but denominator is indeterminate (e.g., oscillating)
            return new ConvergenceResult().divergeIndeterminant();
        }
        
        // Case 3: Numerator diverges, denominator converges to finite value
        if (!numeratorConverge.converges && denominatorConverge.converges) {
            if (denominatorConverge.limit === 0) {
                return new ConvergenceResult().divergeIndeterminant();
            }
            if (numeratorConverge.divergeTo !== undefined) {
                // Infinity / Finite = Infinity
                return new ConvergenceResult().diverge(
                    numeratorConverge.divergeTo,
                    numeratorConverge.growthKind ?? GrowthKind.Polynomial
                );
            }
            // Numerator is indeterminate (e.g., oscillating)
            return new ConvergenceResult().divergeIndeterminant();
        }
        
        // Case 4: Both diverge - need to compare growth rates
        if (!numeratorConverge.converges && !denominatorConverge.converges) {
            if (numeratorConverge.divergeTo !== undefined && denominatorConverge.divergeTo !== undefined) {
                // Compare growth kinds
                const numGrowth = numeratorConverge.growthKind ?? GrowthKind.Polynomial;
                const denGrowth = denominatorConverge.growthKind ?? GrowthKind.Polynomial;
                
                // GrowthKind: Exponential=0 (fastest) < Polynomial=1 < Logarithmic=2 (slowest)
                // So lower number = faster growth
                if (denGrowth < numGrowth) {
                    // Denominator grows faster -> converges to 0
                    return new ConvergenceResult().converge(0, GrowthKind.Polynomial);
                } else if (numGrowth < denGrowth) {
                    // Numerator grows faster -> diverges
                    const sign = Math.sign(numeratorConverge.divergeTo) * Math.sign(denominatorConverge.divergeTo);
                    return new ConvergenceResult().diverge(sign * Infinity, numGrowth);
                }
                // Same growth kind - indeterminate without more info (would need coefficient comparison)
                return new ConvergenceResult().divergeIndeterminant();
            }
            // At least one is indeterminate (oscillating, like sin(n))
            // Check if one is bounded oscillating and the other diverges
            if (numeratorConverge.divergeTo === undefined && denominatorConverge.divergeTo !== undefined) {
                // Numerator is bounded (oscillating), denominator diverges -> converges to 0
                return new ConvergenceResult().converge(0, GrowthKind.Polynomial);
            }
            if (numeratorConverge.divergeTo !== undefined && denominatorConverge.divergeTo === undefined) {
                // Numerator diverges, denominator is bounded (oscillating) -> diverges indeterminately
                return new ConvergenceResult().divergeIndeterminant();
            }
            return new ConvergenceResult().divergeIndeterminant();
        }
    }
    return new ConvergenceResult().divergeIndeterminant();
}

