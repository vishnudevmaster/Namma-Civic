// Local development server entry point
// This file starts the Express server with Vite middleware for local development
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// Import the Express app with all API routes already registered
import app from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startDevServer() {
    if (process.env.NODE_ENV === 'production') {
        // Production: serve static files
        app.use(express.static(path.join(__dirname, 'dist')));
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'dist', 'index.html'));
        });
    } else {
        // Development: use Vite middleware for HMR
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🏙️ NammaCivic server running on http://localhost:${PORT}`);
        console.log(`🔌 Database connected to Supabase`);
    });
}

startDevServer();
