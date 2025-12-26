import { parseExpression, simplify, converge, expressionToLatex } from '../dist/web.js';

document.getElementById('checkBtn').addEventListener('click', () => {
    const input = document.getElementById('expression').value;
    const parsedExprEl = document.getElementById('parsedExpr');
    const resultEl = document.getElementById('result');
    const stepsSection = document.getElementById('stepsSection');
    
    try {
        // Parse the expression
        const ast = parseExpression(input);
        
        // Display the parsed expression using KaTeX
        const latex = expressionToLatex(ast);
        katex.render(latex, parsedExprEl, {
            throwOnError: false,
            displayMode: true
        });
        
        // Simplify and check convergence
        const simplified = simplify(ast);
        const result = converge(simplified);
        
        // Display result
        resultEl.className = 'result-box';
        if (result === false) {
            resultEl.className += ' diverges';
            resultEl.innerHTML = '❌ The series <strong>diverges</strong>';
        } else {
            resultEl.className += ' converges';
            const limitLatex = typeof result === 'number' ? result.toString() : 'L';
            resultEl.innerHTML = `✅ The series <strong>converges</strong> to: ${result}`;
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
