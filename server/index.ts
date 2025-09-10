// SecureYT - Chrome Extension Project
// This file exists to prevent workflow errors but is not used
// The actual application is a Chrome extension in the /extension folder

console.log('SecureYT is a Chrome extension project');
console.log('The main application files are in the /extension folder');
console.log('PWA version is available in the /pwa folder');
console.log('This server file is only a placeholder to prevent build errors');

// Simple server to keep the workflow happy
import express from 'express';
import path from 'path';

const app = express();
const PORT = parseInt(process.env.PORT || '5000');

// Serve static files from extension folder
app.use('/extension', express.static(path.join(process.cwd(), 'extension')));
app.use('/pwa', express.static(path.join(process.cwd(), 'pwa')));

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>SecureYT - Chrome Extension Project</title>
        <style>
          body { font-family: Arial; padding: 2rem; background: #1a1a1a; color: white; }
          .container { max-width: 800px; margin: 0 auto; }
          .section { background: #374151; padding: 1.5rem; margin: 1rem 0; border-radius: 8px; }
          .btn { background: #ef4444; color: white; padding: 1rem 2rem; border: none; border-radius: 6px; margin: 0.5rem; cursor: pointer; }
          h1 { color: #ef4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🛡️ SecureYT - Chrome Extension Project</h1>
          
          <div class="section">
            <h2>📁 Project Structure</h2>
            <p><strong>Chrome Extension:</strong> <code>/extension</code> folder</p>
            <p><strong>PWA Version:</strong> <code>/pwa</code> folder</p>
          </div>
          
          <div class="section">
            <h2>🔧 Installation Instructions</h2>
            <ol>
              <li>Open Chrome and go to <code>chrome://extensions</code></li>
              <li>Enable "Developer mode" in the top right</li>
              <li>Click "Load unpacked" and select the <code>/extension</code> folder</li>
              <li>The SecureYT extension will be installed and ready to use</li>
            </ol>
          </div>
          
          <div class="section">
            <h2>📱 PWA Installation</h2>
            <p>For mobile devices, deploy the <code>/pwa</code> folder to any web hosting service.</p>
            <p>Users can install it directly from their mobile browser.</p>
            <button class="btn" onclick="window.open('/pwa', '_blank')">View PWA Demo</button>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SecureYT project server running on http://0.0.0.0:${PORT}`);
  console.log('Note: This is just a development server for the project files');
  console.log('The actual SecureYT extension is in the /extension folder');
});