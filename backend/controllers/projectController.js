const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');

// @desc  Create project
// @route POST /api/projects
const createProject = async (req, res) => {
  try {
    const { name, description, memberEmails } = req.body;
    let memberIds = [req.user._id];

    if (memberEmails && memberEmails.length > 0) {
      const users = await User.find({ email: { $in: memberEmails } });
      const ids = users.map((u) => u._id.toString());
      memberIds = [...new Set([...memberIds.map(String), ...ids])];
    }

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: memberIds,
    });

    // Add project to each member's projects array
    await User.updateMany({ _id: { $in: memberIds } }, { $addToSet: { projects: project._id } });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email role');

    res.status(201).json({ success: true, project: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all projects for current user
// @route GET /api/projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user._id })
      .populate('owner', 'name email')
      .populate('members', 'name email role')
      .sort('-createdAt');
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single project
// @route GET /api/projects/:id
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email role');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const isMember = project.members.some((m) => m._id.toString() === req.user._id.toString());
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not a member of this project' });
    }

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Add member to project
// @route POST /api/projects/:id/members
const addMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owner or admin can add members' });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (project.members.includes(user._id)) {
      return res.status(400).json({ success: false, message: 'User already a member' });
    }

    project.members.push(user._id);
    await project.save();
    await User.findByIdAndUpdate(user._id, { $addToSet: { projects: project._id } });

    const updated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email role');

    res.json({ success: true, project: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete project (admin/owner only)
// @route DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Task.deleteMany({ project: project._id });
    await User.updateMany({ projects: project._id }, { $pull: { projects: project._id } });
    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createProject, getProjects, getProject, addMember, deleteProject };
