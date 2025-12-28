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
        this.coefficients = coefficients;
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
        const baseFunc = parseFunction(powExp.base);
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
            if(!numeratorLimit.converges || !denominatorLimit.converges){
                return new ConvergenceResult().divergeIndeterminant();
            }
            if(denominatorLimit.limit === 0){
                return new ConvergenceResult().divergeIndeterminant();
            }
            return new ConvergenceResult().converge(
                numeratorLimit.limit! / denominatorLimit.limit!,
                GrowthKind.Polynomial
            );
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
                return new ConvergenceResult().converge(
                    Math.log(argConverge.limit!) / Math.log((func as LogFunction).base),
                    GrowthKind.Logarithmic
                );
            }
            if(func instanceof LnFunction){
                return new ConvergenceResult().converge(
                    Math.log(argConverge.limit!),
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
                return new ConvergenceResult().converge(
                    Math.sqrt(argConverge.limit!),
                    GrowthKind.Polynomial
                );
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
        }
        if(func instanceof TanFunction){
            throw new Error("Convergence of tangent function not supported");
        }
    }
    if(func instanceof AddFunction){
        let leftConverge = converge(func.left);
        let rightConverge = converge(func.right);
        if(!leftConverge.converges || !rightConverge.converges){
            return new ConvergenceResult().divergeIndeterminant();
        }
        return new ConvergenceResult().converge(
            leftConverge.limit! + rightConverge.limit!,
            GrowthKind.Polynomial
        );
    }
    if(func instanceof MultiplyFunction){
        let leftConverge = converge(func.left);
        let rightConverge = converge(func.right);
        if(!leftConverge.converges || !rightConverge.converges){
            return new ConvergenceResult().divergeIndeterminant();
        }
        return new ConvergenceResult().converge(
            leftConverge.limit! * rightConverge.limit!,
            GrowthKind.Polynomial
        );
    }
    if(func instanceof DivideFunction){
        let numeratorConverge = converge(func.numerator);
        let denominatorConverge = converge(func.denominator);
        if(!numeratorConverge.converges || !denominatorConverge.converges){
            return new ConvergenceResult().divergeIndeterminant();
        }
        if(denominatorConverge.limit === 0){
            return new ConvergenceResult().divergeIndeterminant();
        }
        return new ConvergenceResult().converge(
            numeratorConverge.limit! / denominatorConverge.limit!,
            GrowthKind.Polynomial
        );
    }
    return new ConvergenceResult().divergeIndeterminant();
}

