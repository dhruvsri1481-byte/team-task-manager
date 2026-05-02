const User = require('../models/User');

// @desc  Get all users (admin) or project members search
// @route GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('name');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get user by ID
// @route GET /api/users/:id
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getUsers, getUser };
