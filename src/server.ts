import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 8000;
const PUBLIC_DIR = join(__dirname, '..', 'public');
const DIST_DIR = join(__dirname);

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
    try {
        let filePath: string = req.url === '/' ? '/verge.html' : (req.url || '/verge.html');
        
        // Remove query string
        filePath = filePath.split('?')[0];
        
        // Determine which directory to serve from
        let fullPath: string;
        if (filePath.startsWith('/dist/')) {
            fullPath = join(DIST_DIR, '..', filePath);
        } else {
            fullPath = join(PUBLIC_DIR, filePath);
        }
        
        const ext = extname(fullPath);
        const contentType = (MIME_TYPES as any)[ext] || 'application/octet-stream';
        
        const content = await readFile(fullPath);
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
        
        console.log(`✓ ${req.method} ${req.url} - 200`);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            res.writeHead(404);
            res.end('404 Not Found');
            console.log(`✗ ${req.method} ${req.url} - 404`);
        } else {
            res.writeHead(500);
            res.end('500 Internal Server Error');
            console.log(`✗ ${req.method} ${req.url} - 500`);
        }
    }
});

server.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}/`);
    console.log(`📁 Serving files from: ${PUBLIC_DIR}\n`);
});
