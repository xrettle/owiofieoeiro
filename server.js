/**
 * Duolingo Locker Room Web Server
 *
 * Local server providing a rich user interface to browse, select,
 * and claim Duolingo extra items (avatars, country suits, banners, freezes).
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { getCredentials, getUserInventoryAndGems } = require('./helper.js');
const { ITEMS_CATALOG, CATEGORIES } = require('./items-catalog.js');
const { claimItem, claimBatch } = require('./item-claimer.js');

const PORT = parseInt(process.env.PORT, 10) || 3456;
const PUBLIC_DIR = path.join(__dirname, 'public');

/**
 * Helper to parse incoming JSON request body
 */
function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 1e6) {
                req.destroy();
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            if (!body.trim()) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error(`Invalid JSON body: ${err.message}`));
            }
        });
        req.on('error', reject);
    });
}

/**
 * Sends a JSON response with appropriate headers
 */
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        return res.end();
    }

    try {
        // ----------------------------------------------------
        // API ROUTES
        // ----------------------------------------------------

        // GET /api/catalog
        if (req.method === 'GET' && pathname === '/api/catalog') {
            return sendJson(res, 200, {
                catalog: ITEMS_CATALOG,
                categories: CATEGORIES
            });
        }

        // GET /api/status
        if (req.method === 'GET' && pathname === '/api/status') {
            const { token, userId } = getCredentials();
            return sendJson(res, 200, {
                hasEnvCredentials: !!(token && userId),
                userIdPreview: userId ? `${userId.substring(0, 4)}...${userId.substring(userId.length - 4)}` : null
            });
        }

        // POST /api/profile
        if (req.method === 'POST' && pathname === '/api/profile') {
            const body = await parseJsonBody(req);
            const envCreds = getCredentials();
            const token = body.token || envCreds.token;
            const userId = body.userId || envCreds.userId;

            if (!token) {
                return sendJson(res, 400, {
                    error: 'Duolingo auth token (JWT) is required. Set it in environment or enter in the UI.'
                });
            }

            const profile = await getUserInventoryAndGems(token, userId);
            return sendJson(res, 200, { profile });
        }

        // POST /api/claim
        if (req.method === 'POST' && pathname === '/api/claim') {
            const body = await parseJsonBody(req);
            const envCreds = getCredentials();
            const token = body.token || envCreds.token;
            const userId = body.userId || envCreds.userId;
            const itemIds = body.itemIds || [];

            if (!token) {
                return sendJson(res, 400, { error: 'Duolingo auth token is required.' });
            }
            if (!Array.isArray(itemIds) || itemIds.length === 0) {
                return sendJson(res, 400, { error: 'No items selected.' });
            }

            const batchResult = await claimBatch(token, userId, itemIds);
            return sendJson(res, 200, batchResult);
        }

        // ----------------------------------------------------
        // STATIC FILES (Frontend UI)
        // ----------------------------------------------------
        if (req.method === 'GET') {
            let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                const ext = path.extname(filePath).toLowerCase();
                const mimeTypes = {
                    '.html': 'text/html; charset=utf-8',
                    '.css': 'text/css; charset=utf-8',
                    '.js': 'application/javascript; charset=utf-8',
                    '.json': 'application/json',
                    '.png': 'image/png',
                    '.svg': 'image/svg+xml',
                    '.ico': 'image/x-icon'
                };
                const contentType = mimeTypes[ext] || 'application/octet-stream';
                res.writeHead(200, { 'Content-Type': contentType });
                fs.createReadStream(filePath).pipe(res);
                return;
            }

            // Fallback to index.html for SPA-style routing
            const indexPath = path.join(PUBLIC_DIR, 'index.html');
            if (fs.existsSync(indexPath)) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                fs.createReadStream(indexPath).pipe(res);
                return;
            }
        }

        sendJson(res, 404, { error: 'Not Found' });
    } catch (err) {
        console.error('Server error:', err);
        sendJson(res, 500, { error: err.message || 'Internal server error' });
    }
});

function startServer(port = PORT) {
    return new Promise((resolve, reject) => {
        server.listen(port, () => {
            console.log(`\n====================================================`);
            console.log(`Duolingo Locker Room UI Server`);
            console.log(`====================================================`);
            console.log(`Local URL: http://localhost:${port}`);
            console.log(`Ready for item browsing and unlocking.`);
            console.log(`====================================================\n`);
            resolve(server);
        });
        server.on('error', reject);
    });
}

if (require.main === module) {
    startServer().catch(err => {
        console.error('Failed to start UI server:', err);
        process.exit(1);
    });
}

module.exports = {
    server,
    startServer
};
