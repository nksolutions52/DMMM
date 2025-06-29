const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Mock data
const users = [
  { id: '1', name: 'Admin User', email: 'admin@rta.gov', password: 'password123', role: 'admin' },
  { id: '2', name: 'Agent User', email: 'agent@rta.gov', password: 'password123', role: 'agent' }
];

const vehicles = [
  {
    id: '1',
    registration_number: 'KA01MJ2022',
    registered_owner_name: 'Rahul Sharma',
    mobile_number: '9876543210',
    aadhar_number: '1234 5678 9012',
    guardian_info: 'S/o Rajesh Sharma',
    date_of_registration: '2022-05-15',
    address: '123, MG Road, Bangalore, Karnataka',
    type: 'Non Transport',
    makers_name: 'Maruti Suzuki',
    makers_classification: 'Swift',
    chassis_number: 'MBLHA10ATCGJ12345',
    engine_number: 'HA10ENCGJ12345',
    colour: 'White',
    fuel_used: 'Petrol'
  }
];

const serviceTypes = [
  { id: 'transfer', name: 'Transfer of Ownership', fee: 1500 },
  { id: 'permit', name: 'Permit', fee: 1000 },
  { id: 'fitness', name: 'Fitness', fee: 600 }
];

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_super_secret_jwt_key_here');
    req.user = users.find(u => u.id === decoded.userId);
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const token = jwt.sign({ userId: user.id }, 'your_super_secret_jwt_key_here', { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, token }
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ success: true, data: req.user });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

app.get('/api/vehicles', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      vehicles,
      pagination: { currentPage: 1, totalPages: 1, totalCount: vehicles.length }
    }
  });
});

app.get('/api/services/types', authenticateToken, (req, res) => {
  res.json({ success: true, data: serviceTypes });
});

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { title: 'Total Vehicles', value: 1256, icon: 'car', change: 12.5, color: 'blue', label: 'Vehicles' },
      { title: 'New Registrations', value: 78, icon: 'file-plus', change: 8.2, color: 'green', label: 'Registrations' },
      { title: 'Renewals Due', value: 42, icon: 'refresh-cw', change: -3.5, color: 'orange', label: 'Renewals' },
      { title: 'Pending Approvals', value: 15, icon: 'clock', change: -1.8, color: 'red', label: 'Approvals' }
    ]
  });
});

app.get('/api/dashboard/recent-activity', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        service_type: 'Transfer of Ownership',
        registration_number: 'KA01MJ2022',
        agent_name: 'Admin User',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/dashboard/upcoming-renewals', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        renewal_type: 'Insurance',
        registration_number: 'KA01MJ2022',
        registered_owner_name: 'Rahul Sharma',
        due_date: '2024-04-15',
        days_left: 15
      }
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple backend server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🔐 Login with: admin@rta.gov / password123`);
});