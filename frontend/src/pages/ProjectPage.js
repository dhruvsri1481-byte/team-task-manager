import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = { todo: 'Todo', 'in-progress': 'In Progress', done: 'Done' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

function TaskCard({ task, members, onStatusChange, onDelete }) {
  const [updating, setUpdating] = useState(false);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isDone = task.status === 'done';

  const handleStatus = async (status) => {
    setUpdating(true);
    try {
      await onStatusChange(task._id, status);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`card p-4 transition-all ${isDone ? 'opacity-60' : ''} ${isOverdue ? 'border-red-300 bg-red-50/40' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className={`font-medium text-sm leading-snug ${isOverdue ? 'text-red-700' : isDone ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </h4>
        <button
          onClick={() => onDelete(task._id)}
          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 p-0.5 rounded"
          title="Delete task"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {task.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
        {isOverdue && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
            ⚠ Overdue
          </span>
        )}
        {task.dueDate && !isOverdue && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
            Due {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      {task.assignedTo && (
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold flex-shrink-0">
            {task.assignedTo.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-500 truncate">{task.assignedTo.name}</span>
        </div>
      )}
      <select
        className={`w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-opacity ${updating ? 'opacity-40 cursor-wait' : ''} ${isOverdue ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}
        value={task.status}
        onChange={(e) => handleStatus(e.target.value)}
        disabled={updating}
      >
        <option value="todo">Todo</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
      </select>
    </div>
  );
}

export default function ProjectPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'medium', status: 'todo' });
  const [memberEmail, setMemberEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAll = async () => {
    try {
      const [projRes, taskRes, usersRes] = await Promise.all([
        API.get(`/projects/${id}`),
        API.get(`/tasks/project/${id}`),
        API.get('/users'),
      ]);
      setProject(projRes.data.project);
      setTasks(taskRes.data.tasks);
      setAllUsers(usersRes.data.users);
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        projectId: id,
        assignedTo: taskForm.assignedTo || undefined,
        dueDate: taskForm.dueDate || undefined,
        priority: taskForm.priority,
        status: taskForm.status,
      };
      const { data } = await API.post('/tasks', payload);
      setTasks([data.task, ...tasks]);
      setTaskForm({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'medium', status: 'todo' });
      setShowTaskForm(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    const { data } = await API.patch(`/tasks/${taskId}/status`, { status });
    setTasks(tasks.map((t) => (t._id === taskId ? data.task : t)));
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await API.delete(`/tasks/${taskId}`);
    setTasks(tasks.filter((t) => t._id !== taskId));
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const { data } = await API.post(`/projects/${id}/members`, { email: memberEmail });
      setProject(data.project);
      setMemberEmail('');
      setShowMemberForm(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await API.delete(`/projects/${id}`);
    navigate('/dashboard');
  };

  const filteredTasks = filterStatus === 'all' ? tasks : tasks.filter((t) => t.status === filterStatus);
  const columns = ['todo', 'in-progress', 'done'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isOwnerOrAdmin = project?.owner?._id === user?._id || user?.role === 'admin';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
          {project?.description && <p className="text-gray-500 text-sm mt-0.5">{project.description}</p>}
          <div className="flex items-center gap-3 mt-2">
            {project?.members?.map((m) => (
              <div key={m._id} className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold">
                  {m.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-gray-500">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isOwnerOrAdmin && (
            <button onClick={() => { setFormError(''); setShowMemberForm(true); }} className="btn-secondary text-sm">
              + Member
            </button>
          )}
          <button onClick={() => { setFormError(''); setShowTaskForm(true); }} className="btn-primary text-sm">
            + Task
          </button>
          {isOwnerOrAdmin && (
            <button onClick={handleDeleteProject} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {['all', 'todo', 'in-progress', 'done'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              filterStatus === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filterStatus === s ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
              {s === 'all' ? tasks.length : tasks.filter((t) => t.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Kanban columns */}
      {filterStatus === 'all' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map((col) => (
            <div key={col}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${col === 'todo' ? 'bg-gray-400' : col === 'in-progress' ? 'bg-blue-500' : 'bg-green-500'}`} />
                <h3 className="text-sm font-semibold text-gray-700">{STATUS_LABELS[col]}</h3>
                <span className="text-xs text-gray-400 font-mono">{tasks.filter((t) => t.status === col).length}</span>
              </div>
              <div className="space-y-3">
                {tasks.filter((t) => t.status === col).map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    members={project?.members || []}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteTask}
                  />
                ))}
                {tasks.filter((t) => t.status === col).length === 0 && (
                  <div className="border-2 border-dashed border-gray-100 rounded-xl p-6 text-center">
                    <p className="text-xs text-gray-400">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="card p-8 text-center text-gray-400 text-sm">No tasks in this category</div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                members={project?.members || []}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Task</h2>
            {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" className="input" value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="input resize-none" rows={2} value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="input" value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="input" value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
                <select className="input" value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {project?.members?.map((m) => (
                    <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
                <input type="date" className="input" value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowTaskForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="card w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Team Member</h2>
            {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member email</label>
                <input type="email" className="input" placeholder="colleague@example.com"
                  value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowMemberForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Adding…' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
