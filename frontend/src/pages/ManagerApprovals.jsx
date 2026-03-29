import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import api from '../api/axios';
import { getManagerPendingApprovals, approveManagerExpense, rejectManagerExpense } from '../api/expensesApi';

const ManagerApprovals = () => {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actioning, setActioning] = useState({});

    const buildReceiptUrl = (expense) => {
        if (expense.receipt_file) {
            return `${api.defaults.baseURL}/${expense.receipt_file}`;
        }
        return '';
    };

    const fetchPendingApprovals = async () => {
        setLoading(true);
        try {
            const res = await getManagerPendingApprovals();
            setApprovals(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load approvals.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPendingApprovals(); }, []);

    const handleAction = async (expenseId, action) => {
        setActioning(prev => ({ ...prev, [expenseId]: action }));
        setError('');
        try {
            if (action === 'approve') {
                await approveManagerExpense(expenseId);
            } else {
                await rejectManagerExpense(expenseId);
            }
            await fetchPendingApprovals();
        } catch (err) {
            setError(err.response?.data?.detail || `Failed to ${action} expense.`);
        } finally {
            setActioning(prev => ({ ...prev, [expenseId]: null }));
        }
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manager Approvals</h1>
                    <p className="text-sm text-gray-500 mt-1">{approvals.length} pending request{approvals.length !== 1 ? 's' : ''}</p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

                {loading ? (
                    <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                ) : approvals.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 text-center py-16 text-gray-400">No pending approvals.</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Expense ID</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Request Owner</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Category</th>
                                        <th className="text-right px-5 py-3 font-semibold text-gray-600">Total Amount</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Receipt</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {approvals.map(expense => (
                                        <tr key={expense.id} className="hover:bg-gray-50 transition">
                                            <td className="px-5 py-3 font-mono text-xs text-gray-700">{expense.id}</td>
                                            <td className="px-5 py-3 font-medium text-gray-800">{expense.employee_name || '—'}</td>
                                            <td className="px-5 py-3">{expense.category}</td>
                                            <td className="px-5 py-3 text-right font-mono font-medium">{expense.original_amount.toFixed(2)} {expense.currency}</td>
                                            <td className="px-5 py-3">
                                                {buildReceiptUrl(expense) ? (
                                                    <button onClick={() => window.open(buildReceiptUrl(expense), '_blank')} className="text-xs text-indigo-600 hover:underline">View</button>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAction(expense.id, 'approve')}
                                                        disabled={actioning[expense.id]}
                                                        className={`text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition ${actioning[expense.id] ? 'opacity-60' : ''}`}
                                                    >
                                                        {actioning[expense.id] === 'approve' ? 'Approving...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(expense.id, 'reject')}
                                                        disabled={actioning[expense.id]}
                                                        className={`text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition ${actioning[expense.id] ? 'opacity-60' : ''}`}
                                                    >
                                                        {actioning[expense.id] === 'reject' ? 'Rejecting...' : 'Reject'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default ManagerApprovals;
