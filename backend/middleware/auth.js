const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists
    const userResult = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, r.name as role_name, r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [decoded.userId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    req.user = {
      ...user,
      role: user.role || user.role_name, // Fallback for compatibility
      permissions: user.permissions || {}
    };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role || req.user.role_name;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    const userPermissions = req.user.permissions || {};
    const userRole = req.user.role || req.user.role_name;
    
    // Admin has all permissions
    if (userRole === 'admin' || userPermissions.all) {
      return next();
    }
    
    // Check specific permission
    if (userPermissions[permission]) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.'
    });
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  checkPermission
};