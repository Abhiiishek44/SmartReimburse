import { useState, useEffect } from 'react';
import { getUsers, createRule, addApprovers, updateRule } from '../api/adminApi';
import ApproverSelector from './ApproverSelector';

const defaultForm = {
    rule_name: '',
    description: '',
    is_manager_approver: false,
    is_sequential: true,
    min_approval_percentage: 100,
};

const RuleForm = ({ existingRule = null, onSaved, onCancel }) => {
    const [form, setForm] = useState(existingRule
        ? {
            rule_name: existingRule.rule_name,
            description: existingRule.description || '',
            is_manager_approver: existingRule.is_manager_approver,
            is_sequential: existingRule.is_sequential,
            min_approval_percentage: existingRule.min_approval_percentage,
        }
        : defaultForm
    );
    const [users, setUsers] = useState([]);
    const [approvers, setApprovers] = useState(() => {
        if (!existingRule?.approvers) return [];
        return existingRule.approvers.map(a => ({
            approver_id: a.approver_id,
            step_order: a.step_order,
            user: a.approver,
        }));
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        getUsers().then(res => setUsers(res.data)).catch(() => {});
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'min_approval_percentage' ? parseFloat(value) : value),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            let rule;
            if (existingRule) {
                const res = await updateRule(existingRule.id, form);
                rule = res.data;
            } else {
                const res = await createRule(form);
                rule = res.data;
            }
            // Save approvers
            if (approvers.length > 0) {
                const approverPayload = approvers.map(a => ({
                    approver_id: a.approver_id,
                    step_order: a.step_order,
                }));
                const res2 = await addApprovers(rule.id, approverPayload);
                rule = res2.data;
            }
            onSaved(rule);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save rule.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name *</label>
                    <input name="rule_name" type="text" required value={form.rule_name} onChange={handleChange}
                        placeholder="e.g. Standard Expense Approval"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Approval {!form.is_sequential && <span className="text-gray-400">(parallel mode)</span>}
                    </label>
                    <div className="relative">
                        <input name="min_approval_percentage" type="number" min="1" max="100"
                            value={form.min_approval_percentage} onChange={handleChange}
                            disabled={form.is_sequential}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400" />
                        <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                    </div>
                    {form.is_sequential && <p className="text-xs text-gray-400 mt-1">Not applicable in sequential mode (100% required)</p>}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={2} value={form.description} onChange={handleChange}
                    placeholder="Optional description for this rule..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>

            <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" name="is_manager_approver" checked={form.is_manager_approver} onChange={handleChange}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                    <div>
                        <p className="text-sm font-medium text-gray-700">Manager is Approver</p>
                        <p className="text-xs text-gray-400">Employee's manager auto-added as first approver</p>
                    </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" name="is_sequential" checked={form.is_sequential} onChange={handleChange}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                    <div>
                        <p className="text-sm font-medium text-gray-700">Sequential Approval</p>
                        <p className="text-xs text-gray-400">Approvers go in order (Step 1 → 2 → 3)</p>
                    </div>
                </label>
            </div>

            {!form.is_sequential && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                    <strong>Parallel Mode:</strong> All approvers are notified at once. Approval is granted when minimum approval percentage is reached.
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approvers {form.is_sequential ? <span className="text-gray-400 text-xs font-normal">(drag to reorder steps)</span> : <span className="text-gray-400 text-xs font-normal">(parallel)</span>}
                </label>
                <ApproverSelector
                    users={users}
                    approvers={approvers}
                    setApprovers={setApprovers}
                    isSequential={form.is_sequential}
                />
            </div>

            <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                    className={`bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {saving ? 'Saving...' : existingRule ? 'Update Rule' : 'Create Rule'}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel}
                        className="border border-gray-300 text-gray-600 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default RuleForm;
