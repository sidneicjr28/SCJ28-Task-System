const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/apiRoutes');

const app = express();
const INITIAL_PORT = parseInt(process.env.PORT || '2800', 10);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
