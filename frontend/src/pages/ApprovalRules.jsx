import { useState, useEffect } from 'react';
import { getRules, deleteRule } from '../api/adminApi';
import RuleForm from '../components/RuleForm';

const ApprovalRules = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [error, setError] = useState('');

    const loadRules = async () => {
        setLoading(true);
        try {
            const res = await getRules();
            setRules(res.data);
        } catch {
            setError('Failed to load rules.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadRules(); }, []);

    const handleSaved = () => {
        setShowCreate(false);
        setEditingRule(null);
        loadRules();
    };

    const handleDelete = async (ruleId) => {
        if (!confirm('Delete this rule?')) return;
        try {
            await deleteRule(ruleId);
            setRules(prev => prev.filter(r => r.id !== ruleId));
        } catch {
            setError('Failed to delete rule.');
        }
    };

    const formatApprovers = (rule) => {
        if (!rule.approvers?.length) return 'No approvers';
        if (rule.is_sequential) {
            return rule.approvers
                .sort((a, b) => a.step_order - b.step_order)
                .map(a => `${a.step_order}. ${a.approver?.name}`)
                .join(' → ');
        }
        return rule.approvers.map(a => a.approver?.name).join(', ');
    };

    return (
        <div className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Approval Rules</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Define who approves expense requests and in what order.</p>
                </div>
                {!showCreate && !editingRule && (
                    <button onClick={() => setShowCreate(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
                        + New Rule
                    </button>
                )}
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="bg-white border border-indigo-100 rounded-xl shadow-sm p-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">Create New Rule</h3>
                    <RuleForm onSaved={handleSaved} onCancel={() => setShowCreate(false)} />
                </div>
            )}

            {/* Edit Form */}
            {editingRule && (
                <div className="bg-white border border-indigo-100 rounded-xl shadow-sm p-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">Edit Rule</h3>
                    <RuleForm existingRule={editingRule} onSaved={handleSaved} onCancel={() => setEditingRule(null)} />
                </div>
            )}

            {/* Rules List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : rules.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-gray-500">No approval rules yet.</p>
                    <button onClick={() => setShowCreate(true)} className="mt-4 text-indigo-600 text-sm font-medium hover:underline">
                        Create your first rule →
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {rules.map(rule => (
                        <div key={rule.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="text-base font-semibold text-gray-900">{rule.rule_name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rule.is_sequential ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {rule.is_sequential ? 'Sequential' : 'Parallel'}
                                        </span>
                                        {rule.is_manager_approver && (
                                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                                                Manager Approver
                                            </span>
                                        )}
                                    </div>
                                    {rule.description && <p className="text-sm text-gray-500 mb-2">{rule.description}</p>}
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">Flow: </span>
                                        <span className="font-mono text-xs">{formatApprovers(rule)}</span>
                                    </div>
                                    {!rule.is_sequential && (
                                        <p className="text-xs text-amber-600 mt-1">Min approval: {rule.min_approval_percentage}%</p>
                                    )}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => setEditingRule(rule)}
                                        className="text-sm text-indigo-600 border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50 transition font-medium">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(rule.id)}
                                        className="text-sm text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition font-medium">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApprovalRules;
