const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 2800;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Routes
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`SCJ28 Task Manager Server running on http://localhost:${PORT}`);
});
