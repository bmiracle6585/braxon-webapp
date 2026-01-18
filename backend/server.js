require('dotenv').config({ path: '/opt/bitnami/apache/htdocs/backend/.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');

const app = express();

// Middleware - MUST COME FIRST!
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
sequelize.authenticate()
  .then(() => console.log('✅ Database connected successfully'))
  .catch(err => console.error('❌ Database connection error:', err));

// API Routes - BEFORE static files!
try {
    app.use('/api/auth', require('./routes/auth'));
    console.log('✅ Auth routes loaded');
} catch (err) {
    console.error('❌ Auth routes error:', err.message);
}
app.use('/api/projects', require('./routes/projects'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/screen-captures', require('./routes/screenCaptures'));
app.use('/api/daily-reports', require('./routes/dailyReports'));
app.use('/api/receipts', require('./routes/receipts'));
app.use('/api/modules', require('./routes/modules')); 
app.use('/api/team', require('./routes/team'));
app.use('/api/user-profile', require('./routes/userProfile'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/photo-documentation', require('./routes/photoDocumentation'));

// Profile Routes
try {
    app.use('/api/users/:userId/emergency-contacts', require('./routes/emergencyContacts'));
    console.log('✅ Emergency contacts route loaded');
} catch (err) {
    console.error('❌ Emergency contacts route error:', err.message);
}

try {
    app.use('/api/users/:userId/certifications', require('./routes/certifications'));
    console.log('✅ Certifications route loaded');
} catch (err) {
    console.error('❌ Certifications route error:', err.message);
}

try {
    app.use('/api/users/:userId/equipment', require('./routes/equipment'));
    console.log('✅ Equipment route loaded');
} catch (err) {
    console.error('❌ Equipment route error:', err.message);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Braxon API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve static files - AFTER API routes!
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/receipts', express.static(path.join(__dirname, '../uploads/receipts')));

// HTML Routes
app.get('/', (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);

  if (isMobile) {
    return res.sendFile(path.join(__dirname, '../mobile-login.html'));
  }

  return res.sendFile(path.join(__dirname, '../index.html'));
});


app.get('/admin-console', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-console.html'));
});

app.get(['/dashboard', '/dashboard.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard.html'));
});

app.get('/projects', (req, res) => { 
  res.sendFile(path.join(__dirname, '../projects.html'));
});

app.get('/tech-portal', (req, res) => {
  res.sendFile(path.join(__dirname, '../tech-portal.html'));
});
app.get(['/login', '/login.html'], (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);

  if (isMobile) {
    return res.sendFile(path.join(__dirname, '../mobile-login.html'));
  }

  return res.sendFile(path.join(__dirname, '../index.html'));
});



// Other page routes
const pages = [
  'project-details.html',
  'project-authorization.html',
  'execution-readiness.html',
  'site-module-entry.html',
  'photo-documentation.html',
  'module-detail.html',
  'screen-captures.html',
  'configuration-files.html',
  'closeout-package.html',
];

pages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, `../${page}`));
  });
});

// Static files for CSS/JS/assets - MOST GENERAL, LAST!
app.use(express.static(path.join(__dirname, '..')));

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '../icons/icon-192.png'));
});

// Error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 5000;

async function syncDatabase() {
  try {
    console.log('✅ Database sync skipped - using manual tables');
    return true;
  } catch (error) {
    console.error('❌ Database sync error:', error);
    throw error;
  }
}

process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Braxon App: http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/`);
  console.log(`📡 API: http://localhost:${PORT}/api/health`);
  console.log(`🧾 Receipts API: http://localhost:${PORT}/api/receipts\n`);
  console.log('✅ Server is RUNNING - Press Ctrl+C to stop\n');
});
