import { Tokenizer } from './tokenizer.js';
import { Parser } from './parser.js';
import { simplify, converge } from './converge.js';
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
    
    // Negative exponents
    {
        name: "Negative exponents: (2n^-2)/(2n^-1)",
        expression: "(2*n^-2)/(2*n^-1)",
        expected: false // diverges (n^-1 → 0)
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
            const simplified = simplify(ast);
            const result = converge(simplified);

            let success = false;
            let actualStr = '';

            if (testCase.expected === false) {
                // Expect divergence
                success = result === false;
                actualStr = result === false ? 'diverges' : `converges to ${result}`;
            } else {
                // Expect convergence to specific value
                if (typeof result === 'number') {
                    const tolerance = testCase.tolerance || 0.0001;
                    const expectedNum = testCase.expected as number;
                    success = Math.abs(result - expectedNum) < tolerance;
                    actualStr = `${result.toFixed(6)}`;
                } else {
                    actualStr = 'diverges';
                }
            }

            const status = success ? '✓ PASS' : '✗ FAIL';
            console.log(`${status} | ${testCase.name}`);
            if (!success) {
                console.log(`      Expression: ${testCase.expression}`);
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
