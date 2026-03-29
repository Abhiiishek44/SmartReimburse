import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { getApprovalConfig, updateApprovalConfig, getUsers } from '../api/adminApi';

const APPROVAL_TYPES = [
    { value: 'SEQUENTIAL', label: 'Sequential' },
    { value: 'PERCENTAGE', label: 'Percentage' },
    { value: 'SPECIFIC', label: 'Specific Approver' },
    { value: 'HYBRID', label: 'Hybrid (Percentage or Specific)' },
];

const ApprovalSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({
        approval_type: 'SEQUENTIAL',
        percentage_value: 60,
        specific_approver_id: '',
        approvers: [
            { approver_id: '', step_order: 1 },
            { approver_id: '', step_order: 2 },
            { approver_id: '', step_order: 3 },
        ],
    });

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const [cfgRes, usersRes] = await Promise.all([getApprovalConfig(), getUsers()]);
                setUsers(usersRes.data || []);
                if (cfgRes.data) {
                    setForm({
                        approval_type: cfgRes.data.approval_type || 'SEQUENTIAL',
                        percentage_value: cfgRes.data.percentage_value ?? 60,
                        specific_approver_id: cfgRes.data.specific_approver_id || '',
                        approvers: (cfgRes.data.approvers || []).map(a => ({
                            approver_id: a.approver_id,
                            step_order: a.step_order,
                        })).concat([
                            { approver_id: '', step_order: 1 },
                            { approver_id: '', step_order: 2 },
                            { approver_id: '', step_order: 3 },
                        ]).slice(0, 3),
                    });
                }
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load approval config.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const approverOptions = users.filter(u => ['manager', 'finance', 'director'].includes(u.role));

    const handleApproverChange = (index, value) => {
        const updated = form.approvers.map((a, i) => i === index ? { ...a, approver_id: value } : a);
        setForm({ ...form, approvers: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const approvers = form.approvers
                .filter(a => a.approver_id)
                .map((a, idx) => ({ approver_id: a.approver_id, step_order: idx + 1 }));

            await updateApprovalConfig({
                approval_type: form.approval_type,
                percentage_value: form.approval_type === 'PERCENTAGE' || form.approval_type === 'HYBRID' ? Number(form.percentage_value) : null,
                specific_approver_id: form.approval_type === 'SPECIFIC' || form.approval_type === 'HYBRID' ? form.specific_approver_id || null : null,
                approvers,
            });
            setSuccess('Approval configuration updated.');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save approval config.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout>
            <div className="max-w-3xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Approval Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure the approval flow for expenses.</p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

                {loading ? (
                    <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Approval Type</label>
                            <select
                                value={form.approval_type}
                                onChange={e => setForm({ ...form, approval_type: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {APPROVAL_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        {(form.approval_type === 'PERCENTAGE' || form.approval_type === 'HYBRID') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Approval Percentage</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={form.percentage_value}
                                    onChange={e => setForm({ ...form, percentage_value: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        )}

                        {(form.approval_type === 'SPECIFIC' || form.approval_type === 'HYBRID') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Specific Approver</label>
                                <select
                                    value={form.specific_approver_id}
                                    onChange={e => setForm({ ...form, specific_approver_id: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select approver</option>
                                    {approverOptions.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Approver Sequence</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {form.approvers.map((a, idx) => (
                                    <select
                                        key={idx}
                                        value={a.approver_id}
                                        onChange={e => handleApproverChange(idx, e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Step {idx + 1}</option>
                                        {approverOptions.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className={`bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition ${saving ? 'opacity-60' : ''}`}
                        >
                            {saving ? 'Saving...' : 'Save Approval Settings'}
                        </button>
                    </form>
                )}
            </div>
        </AppLayout>
    );
};

export default ApprovalSettings;
