import { Tokenizer } from './tokenizer.js';
import { Parser } from './parser.js';
import { converge, parseFunction, ConvergenceResult } from './converge.js';
import { Expression } from './parser.js';

interface TestCase {
    name: string;
    expression: string;
    expected: number | boolean; // false for diverge, number for convergence limit
    tolerance?: number; // for floating point comparison
}

const testCases: TestCase[] = [
    // Simple constant fractions
    {
        name: "Constant fraction: 1/2",
        expression: "1/2",
        expected: 0.5
    },
    {
        name: "Constant fraction: 3/4",
        expression: "3/4",
        expected: 0.75
    },
    
    // Linear over linear (converges to ratio of leading coefficients)
    {
        name: "Linear: (2n+1)/(3n+2)",
        expression: "(2n+1)/(3n+2)",
        expected: 2/3,
        tolerance: 0.0001
    },
    {
        name: "Linear: (n+5)/(2n-3)",
        expression: "(n+5)/(2n-3)",
        expected: 0.5,
        tolerance: 0.0001
    },
    {
        name: "Linear: (5n)/(2n+1)",
        expression: "(5n)/(2n+1)",
        expected: 2.5,
        tolerance: 0.0001
    },
    
    // Quadratic over quadratic
    {
        name: "Quadratic: (n^2+2n)/(3n^2+1)",
        expression: "(n^2+2n)/(3n^2+1)",
        expected: 1/3,
        tolerance: 0.0001
    },
    {
        name: "Quadratic: (2n^2-n)/(n^2+n)",
        expression: "(2n^2-n)/(n^2+n)",
        expected: 2,
        tolerance: 0.0001
    },
    {
        name: "Harmonic 1/n",
        expression: "1/n",
        expected: 0 // converges to 0
    },
    {
        name: "Harmonic n^-1",
        expression: "n^-1",
        expected: 0 // converges to 0
    },
    // Negative exponents
    {
        name: "Negative exponents: (2n^-2)/(2n^-1)",
        expression: "(2*n^-2)/(2*n^-1)",
        expected: 0 // converges to 0 (simplifies to n^-1 = 1/n)
    },
    {
        name: "Negative exponents: n^-1",
        expression: "n^-1",
        expected: 0 // converges to 0 (n^-1 = 1/n)
    },
    
    // Higher order polynomials (numerator lower degree)
    {
        name: "Lower numerator degree: (n+1)/(n^2+2)",
        expression: "(n+1)/(n^2+2)",
        expected: 0 // converges to 0 (numerator degree < denominator degree)
    },
    
    // Higher order polynomials (denominator lower degree)
    {
        name: "Higher numerator degree: (n^2+1)/(n+2)",
        expression: "(n^2+1)/(n+2)",
        expected: false // diverges
    },
    
    // With multiplication
    {
        name: "Multiplication convergence: 2 * (n/(n+1))",
        expression: "2*(n/(n+1))",
        expected: 2,
        tolerance: 0.0001
    },
    
    // With addition
    {
        name: "Addition convergence: (n/(n+1)) + (2n/(2n+1))",
        expression: "(n/(n+1))+(2n/(2n+1))",
        expected: 2,
        tolerance: 0.0001
    },
    
    // With subtraction
    {
        name: "Subtraction convergence: (n/(n+1)) - (1/(n+1))",
        expression: "(n/(n+1))-(1/(n+1))",
        expected: 1,
        tolerance: 0.0001
    },
    
    // Complex expressions
    {
        name: "Complex: (3n^2+2n)/(n^2-5)",
        expression: "(3n^2+2n)/(n^2-5)",
        expected: 3,
        tolerance: 0.0001
    },
    {
        name: "Complex: (n^3+n)/(n^3+n^2+1)",
        expression: "(n^3+n)/(n^3+n^2+1)",
        expected: 1,
        tolerance: 0.0001
    },
    
    // With unary minus
    {
        name: "Unary minus: (-n)/(2n)",
        expression: "-n/(2n)",
        expected: -0.5,
        tolerance: 0.0001
    },
    {
        name: "Unary minus: (2n-1)/(-(n+1))",
        expression: "(2n-1)/(-n-1)",
        expected: -2,
        tolerance: 0.0001
    },
    
    // Edge cases with cancellation
    {
        name: "Cancellation: (n*2)/(n*3)",
        expression: "(n*2)/(n*3)",
        expected: 2/3,
        tolerance: 0.0001
    },
    {
        name: "Cancellation: (2n+2)/(2n+4)",
        expression: "(2n+2)/(2n+4)",
        expected: 1,
        tolerance: 0.0001
    },

    // Trig squeeze cases
    {
        name: "Trig: sin(n)/n -> 0",
        expression: "sin(n)/n",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "Trig: (sin(n)+cos(n))/n -> 0",
        expression: "(sin(n)+cos(n))/n",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "Trig: sin(1/n) -> 0",
        expression: "sin(1/n)",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "Trig: cos(1/n) -> 1",
        expression: "cos(1/n)",
        expected: 1,
        tolerance: 0.0001
    },
    {
        name: "Trig: sin(n) diverges",
        expression: "sin(n)",
        expected: false
    }
    ,
    // Exponential
    {
        name: "Exp: exp(1/n) -> 1",
        expression: "exp(1/n)",
        expected: 1,
        tolerance: 0.0001
    },
    {
        name: "Exp: n/exp(n) -> 0",
        expression: "n/exp(n)",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "Exp: exp(n)/n diverges",
        expression: "exp(n)/n",
        expected: false
    },
    {
        name: "Exp: exp(-n) -> 0",
        expression: "exp(-n)",
        expected: 0,
        tolerance: 0.0001
    },
    
    // Constant base exponentials (b^n)
    {
        name: "b^n: 2^n diverges",
        expression: "2^n",
        expected: false
    },
    {
        name: "b^n: 3^n diverges",
        expression: "3^n",
        expected: false
    },
    {
        name: "b^n: 0.5^n -> 0",
        expression: "0.5^n",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "b^n: (1/2)^n -> 0",
        expression: "(1/2)^n",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "b^n: (1/3)^n -> 0",
        expression: "(1/3)^n",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "b^n: 1^n -> 1",
        expression: "1^n",
        expected: 1,
        tolerance: 0.0001
    },
    {
        name: "b^n: 2^(n+1) diverges",
        expression: "2^(n+1)",
        expected: false
    },
    {
        name: "b^n: 0.5^(2*n) -> 0",
        expression: "0.5^(2*n)",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "b^n ratio: 2^n / 3^n -> 0",
        expression: "2^n / 3^n",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "b^n: 10^(-n) -> 0",
        expression: "10^(-n)",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "b^n: 0.1^n -> 0",
        expression: "0.1^n",
        expected: 0,
        tolerance: 0.0001
    },
    
    // Logarithms
    {
        name: "Log: ln(n) diverges",
        expression: "ln(n)",
        expected: false
    },
    {
        name: "Log: ln(n)/n -> 0",
        expression: "ln(n)/n",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "Log: n/ln(n) diverges",
        expression: "n/ln(n)",
        expected: false
    },
    {
        name: "Log: ln(1/n) diverges",
        expression: "ln(1/n)",
        expected: false
    },
    {
        name: "Log: ln(n+1)/ln(n) -> 1",
        expression: "ln(n+1)/ln(n)",
        expected: 1,
        tolerance: 0.01
    },
    
    // Square root
    {
        name: "Sqrt: sqrt(n) diverges",
        expression: "sqrt(n)",
        expected: false
    },
    {
        name: "Sqrt: sqrt(n)/n -> 0",
        expression: "sqrt(n)/n",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "Sqrt: n/sqrt(n) diverges",
        expression: "n/sqrt(n)",
        expected: false
    },
    {
        name: "Sqrt: sqrt(1/n) -> 0",
        expression: "sqrt(1/n)",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "Sqrt: 1/sqrt(n) -> 0",
        expression: "1/sqrt(n)",
        expected: 0,
        tolerance: 0.0001
    },
    
    // Mixed growth rates
    {
        name: "Growth: n^2/2^n -> 0 (exp > poly)",
        expression: "n^2/2^n",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "Growth: 2^n/n^2 diverges (exp > poly)",
        expression: "2^n/n^2",
        expected: false
    },
    {
        name: "Growth: ln(n)/n -> 0 (log < poly)",
        expression: "ln(n)/n",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "Growth: n/ln(n) diverges (poly > log)",
        expression: "n/ln(n)",
        expected: false
    },
    {
        name: "Growth: ln(n)/2^n -> 0 (log < exp)",
        expression: "ln(n)/2^n",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "Growth: 2^n/ln(n) diverges (exp > log)",
        expression: "2^n/ln(n)",
        expected: false
    },
    
    // Complex rational with exponentials
    {
        name: "Complex: (2^n + n)/(3^n + 1) -> 0",
        expression: "(2^n + n)/(3^n + 1)",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "Complex: (3^n + n)/(2^n + 1) diverges",
        expression: "(3^n + n)/(2^n + 1)",
        expected: false
    },
    {
        name: "Complex: (n^2 + 3*n + 1)/(2*n^2 + n) -> 0.5",
        expression: "(n^2 + 3*n + 1)/(2*n^2 + n)",
        expected: 0.5,
        tolerance: 0.001
    },
    {
        name: "Complex: (5*n^3 - n)/(n^3 + 2*n^2) -> 5",
        expression: "(5*n^3 - n)/(n^3 + 2*n^2)",
        expected: 5,
        tolerance: 0.001
    },
    
    // Edge cases
    {
        name: "Edge: constant 5",
        expression: "5",
        expected: 5
    },
    {
        name: "Edge: constant 0",
        expression: "0",
        expected: 0
    },
    {
        name: "Edge: -3",
        expression: "-3",
        expected: -3
    },
    {
        name: "Edge: n diverges",
        expression: "n",
        expected: false
    },
    {
        name: "Edge: -n diverges",
        expression: "-n",
        expected: false
    },
    {
        name: "Edge: n^2 diverges",
        expression: "n^2",
        expected: false
    },
    {
        name: "Edge: n^3 diverges",
        expression: "n^3",
        expected: false
    },
    
    // Polynomial arithmetic
    {
        name: "Poly: (n+1)*(n+2)/(n^2) -> 1",
        expression: "(n+1)*(n+2)/(n^2)",
        expected: 1,
        tolerance: 0.01
    },
    {
        name: "Poly: n*(n+1)/(n^2+n) -> 1",
        expression: "n*(n+1)/(n^2+n)",
        expected: 1,
        tolerance: 0.001
    },
    
    // Exponential with polynomial coefficients
    {
        name: "Exp-poly: n*2^n diverges",
        expression: "n*2^n",
        expected: false
    },
    {
        name: "Exp-poly: n*0.5^n -> 0",
        expression: "n*0.5^n",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "Exp-poly: (2*n + 1)*0.5^n -> 0",
        expression: "(2*n + 1)*0.5^n",
        expected: 0,
        tolerance: 0.0001
    },
    {
        name: "Exp-poly: 2^n/(n^2 + 1) diverges",
        expression: "2^n/(n^2 + 1)",
        expected: false
    },
    
    // L'Hopital type cases (indeterminate forms)
    {
        name: "L'H: (n^2+n)/(n^2+2*n) -> 1",
        expression: "(n^2+n)/(n^2+2*n)",
        expected: 1,
        tolerance: 0.001
    },
    {
        name: "L'H: (2*n^2-n)/(n^2+3) -> 2",
        expression: "(2*n^2-n)/(n^2+3)",
        expected: 2,
        tolerance: 0.001
    }
];

function testExpressionParsing(expr: string): Expression {
    const tokenizer = new Tokenizer(expr);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    return parser.parse();
}

function runTests(): void {
    console.log('\n' + '='.repeat(70));
    console.log('CONVERGENCE TESTER - TEST SUITE');
    console.log('='.repeat(70) + '\n');

    let passed = 0;
    let failed = 0;
    const failures: string[] = [];

    for (const testCase of testCases) {
        try {
            const ast = testExpressionParsing(testCase.expression);
            const func = parseFunction(ast);
            const result = converge(func);

            let success = false;
            let actualStr = '';

            if (testCase.expected === false) {
                // Expect divergence
                success = !result.converges;
                actualStr = !result.converges ? 'diverges' : `converges to ${result.limit}`;
            } else {
                // Expect convergence to specific value
                if (result.converges) {
                    const tolerance = testCase.tolerance || 0.0001;
                    const expectedNum = testCase.expected as number;
                    success = Math.abs(result.limit! - expectedNum) < tolerance;
                    actualStr = `${result.limit!.toFixed(6)}`;
                } else {
                    actualStr = 'diverges';
                }
            }

            const status = success ? '✓ PASS' : '✗ FAIL';
            console.log(`${status} | ${testCase.name}`);
            console.log(`      Expression: ${testCase.expression}`);
            console.log(`      Result: converges=${result.converges}, limit=${result.limit}, divergeTo=${result.divergeTo}, growthKind=${result.growthKind}`);
            if (!success) {
                const expectedDisplay = testCase.expected === false ? 'diverges' : (testCase.expected as number).toFixed(6);
                console.log(
                    `      Expected: ${expectedDisplay}`
                );
                console.log(`      Got:      ${actualStr}`);
                failures.push(testCase.name);
                failed++;
            } else {
                passed++;
            }
        } catch (error) {
            console.log(`✗ ERROR | ${testCase.name}`);
            console.log(`         Expression: ${testCase.expression}`);
            console.log(`         Error: ${(error as Error).message}`);
            failures.push(testCase.name);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
    console.log('='.repeat(70));

    if (failures.length > 0) {
        console.log('\nFailed tests:');
        failures.forEach((name) => console.log(`  - ${name}`));
    }

    console.log('');
    process.exit(failed === 0 ? 0 : 1);
}

// Run tests
runTests();
