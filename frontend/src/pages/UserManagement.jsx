import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUserRole, assignManager, resetUserPassword } from '../api/usersApi';
import AppLayout from '../components/AppLayout';

const ROLES = ['manager', 'employee', 'finance', 'director'];

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', manager_id: '' });
    const [saving, setSaving] = useState(false);

    const managers = users.filter(u => u.role === 'manager');

    const load = async () => {
        setLoading(true);
        try { const r = await getUsers(); setUsers(r.data); }
        catch { setError('Failed to load users.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault(); setSaving(true); setError('');
        try {
            await createUser({ ...form, manager_id: form.manager_id || null });
            setSuccess('User created!'); setTimeout(() => setSuccess(''), 3000);
            setShowForm(false); setForm({ name: '', email: '', password: '', role: 'employee', manager_id: '' });
            await load();
        } catch (err) { setError(err.response?.data?.detail || 'Failed to create user.'); }
        finally { setSaving(false); }
    };

    const handleRoleChange = async (userId, role) => {
        try { await updateUserRole(userId, { role }); await load(); }
        catch { setError('Failed to update role.'); }
    };

    const handleAssignManager = async (userId, manager_id) => {
        if (!manager_id) return;
        try { await assignManager(userId, manager_id); await load(); }
        catch { setError('Failed to assign manager.'); }
    };

    const handleResetPassword = async (userId) => {
        const newPassword = window.prompt('Enter a new password for this user:');
        if (!newPassword) return;
        try {
            await resetUserPassword(userId, newPassword);
            setSuccess('Password reset successfully.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password.');
        }
    };

    const roleColors = {
        admin: 'bg-purple-100 text-purple-700',
        manager: 'bg-blue-100 text-blue-700',
        finance: 'bg-amber-100 text-amber-700',
        director: 'bg-orange-100 text-orange-700',
        employee: 'bg-green-100 text-green-700',
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-sm text-gray-500 mt-1">{users.length} users in your company</p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
                        {showForm ? 'Cancel' : '+ Add User'}
                    </button>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

                {showForm && (
                    <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
                        <h2 className="text-base font-semibold text-gray-800 mb-4">Create New User</h2>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="john@company.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                </select>
                            </div>
                            {form.role === 'employee' && (
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Manager *</label>
                                    <select required value={form.manager_id} onChange={e => setForm({...form, manager_id: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Select manager</option>
                                        {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="sm:col-span-2 flex gap-3">
                                <button type="submit" disabled={saving} className={`bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition ${saving ? 'opacity-60' : ''}`}>{saving ? 'Creating...' : 'Create User'}</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">No users yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Manager</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => {
                                        const managerUser = users.find(m => m.id === u.manager_id);
                                        return (
                                            <tr key={u.id} className="hover:bg-gray-50 transition">
                                                <td className="px-5 py-3 font-medium text-gray-800">{u.name}</td>
                                                <td className="px-5 py-3 text-gray-500">{u.email}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${roleColors[u.role]}`}>{u.role}</span>
                                                </td>
                                                <td className="px-5 py-3 text-gray-500 text-xs">{managerUser ? managerUser.name : '—'}</td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {u.role !== 'admin' && (
                                                            <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                                                {['manager', 'employee', 'finance', 'director', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
                                                            </select>
                                                        )}
                                                        {u.role !== 'admin' && (
                                                            <button
                                                                onClick={() => handleResetPassword(u.id)}
                                                                className="text-xs text-indigo-600 border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-50 transition"
                                                            >
                                                                Reset Password
                                                            </button>
                                                        )}
                                                        {u.role === 'employee' && (
                                                            <select defaultValue="" onChange={e => handleAssignManager(u.id, e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                                                <option value="" disabled>Assign manager</option>
                                                                {managers.filter(m => m.id !== u.id).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                            </select>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default UserManagement;
