import { useState, useEffect } from 'react';
import { getPendingApprovals, approveExpense, rejectExpense } from '../api/expensesApi';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import api from '../api/axios';

const PendingApprovals = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actioning, setActioning] = useState({});
    const [commentMap, setCommentMap] = useState({});
    const [expandedId, setExpandedId] = useState(null);
    const buildReceiptUrl = (expense) => {
        if (expense.receipt_file) {
            return `${api.defaults.baseURL}/${expense.receipt_file}`;
        }
        return expense.receipt_url || '';
    };

    const load = async () => {
        setLoading(true);
        try { const r = await getPendingApprovals(); setExpenses(r.data); }
        catch { setError('Failed to load pending approvals.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const action = async (type, expenseId) => {
        setActioning(prev => ({ ...prev, [expenseId]: type }));
        try {
            const comment = commentMap[expenseId] || '';
            if (type === 'approve') await approveExpense(expenseId, comment);
            else await rejectExpense(expenseId, comment);
            await load();
            setExpandedId(null);
        } catch (err) {
            setError(err.response?.data?.detail || `Failed to ${type}.`);
        } finally {
            setActioning(prev => ({ ...prev, [expenseId]: null }));
        }
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
                    <p className="text-sm text-gray-500 mt-1">{expenses.length} expense{expenses.length !== 1 ? 's' : ''} awaiting your action</p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

                {loading ? (
                    <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                ) : expenses.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
                        <div className="text-4xl mb-3">✅</div>
                        <p className="text-gray-500">No pending approvals. You're all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {expenses.map(exp => (
                            <div key={exp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900">{exp.employee_name || 'Employee'}</span>
                                            <StatusBadge status={exp.status} />
                                        </div>
                                        <div className="text-2xl font-bold text-indigo-700">{exp.original_amount.toFixed(2)} <span className="text-base font-normal text-gray-500">{exp.currency}</span></div>
                                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                                            <span>📁 {exp.category}</span>
                                            <span>📅 {exp.expense_date}</span>
                                            {exp.description && <span>💬 {exp.description}</span>}
                                            {buildReceiptUrl(exp) && <a href={buildReceiptUrl(exp)} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">📎 Receipt</a>}
                                        </div>

                                        {/* Approval steps */}
                                        {exp.approval_steps?.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {exp.approval_steps.map(step => (
                                                    <span key={step.id} className={`text-xs px-2 py-1 rounded-full font-medium ${step.status === 'approved' ? 'bg-green-100 text-green-700' : step.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        Step {step.step_order}: {step.approver_name || 'Approver'} — {step.status}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)} className="text-sm border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                                            {expandedId === exp.id ? 'Cancel' : 'Action'}
                                        </button>
                                    </div>
                                </div>

                                {expandedId === exp.id && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
                                            <textarea
                                                rows={2}
                                                value={commentMap[exp.id] || ''}
                                                onChange={e => setCommentMap(prev => ({ ...prev, [exp.id]: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                                placeholder="Add a comment..."
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => action('approve', exp.id)}
                                                disabled={actioning[exp.id]}
                                                className={`bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition ${actioning[exp.id] ? 'opacity-60' : ''}`}
                                            >
                                                {actioning[exp.id] === 'approve' ? 'Approving...' : '✓ Approve'}
                                            </button>
                                            <button
                                                onClick={() => action('reject', exp.id)}
                                                disabled={actioning[exp.id]}
                                                className={`bg-red-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition ${actioning[exp.id] ? 'opacity-60' : ''}`}
                                            >
                                                {actioning[exp.id] === 'reject' ? 'Rejecting...' : '✗ Reject'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default PendingApprovals;
