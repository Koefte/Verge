import { parseExpression, converge, expressionToLatex, parseFunction } from '../dist/web.js';

document.getElementById('checkBtn').addEventListener('click', () => {
    const input = document.getElementById('expression').value;
    const parsedExprEl = document.getElementById('parsedExpr');
    const resultEl = document.getElementById('result');
    const stepsSection = document.getElementById('stepsSection');
    
    try {
        // Parse the expression to AST
        const ast = parseExpression(input);
        
        // Display the parsed expression using KaTeX
        const latex = expressionToLatex(ast);
        katex.render(latex, parsedExprEl, {
            throwOnError: false,
            displayMode: true
        });
        
        // Convert AST to BaseFunction and check convergence
        const func = parseFunction(ast);
        const result = converge(func);
        
        // Display result based on ConvergenceResult class
        resultEl.className = 'result-box';
        if (result.converges) {
            resultEl.className += ' converges';
            if (result.limit !== undefined) {
                resultEl.innerHTML = `✅ The series converges to: ${result.limit}`;
            } else {
                resultEl.innerHTML = `✅ The series converges`;
            }
        } else {
            resultEl.className += ' diverges';
            if (result.divergeTo !== undefined) {
                if (result.divergeTo === Infinity) {
                    resultEl.innerHTML = '❌ The series diverges to +∞';
                } else if (result.divergeTo === -Infinity) {
                    resultEl.innerHTML = '❌ The series diverges to -∞';
                } else {
                    resultEl.innerHTML = `❌ The series diverges to ${result.divergeTo}`;
                }
            } else {
                resultEl.innerHTML = '❌ The series diverges (indeterminate)';
            }
        }
        
        // Hide steps section for now
        stepsSection.style.display = 'none';
        
    } catch (error) {
        parsedExprEl.className = 'error';
        parsedExprEl.textContent = `Error: ${error.message}`;
        resultEl.textContent = '';
        stepsSection.style.display = 'none';
    }
});

// Trigger check on Enter key
document.getElementById('expression').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('checkBtn').click();
    }
});

// Initial load
document.getElementById('checkBtn').click();
