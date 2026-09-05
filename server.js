const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    if (typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(envPath);
    } else {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...vals] = trimmed.split('=');
          if (key) {
            process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      });
    }
  } catch (err) {
    console.error('Error loading .env file:', err);
  }
}

const apiRoutes = require('./src/routes/apiRoutes');

const app = express();
const INITIAL_PORT = parseInt(process.env.PORT || '2800', 10);

const diaryUploadDir = path.join(__dirname, 'uploads', 'diary-images');
if (!fs.existsSync(diaryUploadDir)) {
  fs.mkdirSync(diaryUploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bkg-image', express.static(path.join(__dirname, 'bkg-image')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Routes
app.use('/api', apiRoutes);

function startServer(port, maxAttempts = 50) {
  const server = app.listen(port, () => {
    console.log(`==================================================`);
    console.log(` SCJ28 Task Manager Server running on http://localhost:${port}`);
    console.log(`==================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[WARN] Port ${port} is in use. Trying port ${port + 1}...`);
      if (maxAttempts > 0) {
        startServer(port + 1, maxAttempts - 1);
      } else {
        console.error('[ERROR] Could not find an available port after multiple attempts.');
        process.exit(1);
      }
    } else {
      console.error('[ERROR] Server failed to start:', err);
      process.exit(1);
    }
  });
}

startServer(INITIAL_PORT);
