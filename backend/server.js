const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// ==============================
// ✅ FINAL CORS (WORKING)
// ==============================
app.use(cors({
origin: "*", // sab allow (fastest fix)
methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
allowedHeaders: ["Content-Type", "Authorization"],
}));

// ==============================
// MIDDLEWARE
// ==============================
app.use(express.json());

// ==============================
// ROOT ROUTE
// ==============================
app.get('/', (req, res) => {
res.send('🚀 Backend is running successfully');
});

// ==============================
// ROUTES
// ==============================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));

// ==============================
// HEALTH CHECK
// ==============================
app.get('/api/health', (req, res) => {
res.json({ status: 'OK', timestamp: new Date() });
});

// ==============================
// 404 HANDLER
// ==============================
app.use('/api/*', (req, res) => {
res.status(404).json({
success: false,
message: 'Route not found',
});
});

// ==============================
// ERROR HANDLER
// ==============================
app.use((err, req, res, next) => {
console.error(err.stack);
res.status(500).json({
success: false,
message: err.message || 'Internal Server Error',
});
});

// ==============================
// START SERVER
// ==============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
