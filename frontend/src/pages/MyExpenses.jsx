import { useState, useEffect } from 'react';
import { getMyExpenses, submitExpense } from '../api/expensesApi';
import api from '../api/axios';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router';

const MyExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        try { const r = await getMyExpenses(); setExpenses(r.data); }
        catch { setError('Failed to load expenses.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (expenseId) => {
        try { await submitExpense(expenseId); await load(); }
        catch (err) { setError(err.response?.data?.detail || 'Failed to submit.'); }
    };

    const total = expenses.reduce((sum, e) => sum + e.original_amount, 0);
    const approved = expenses.filter(e => e.status === 'approved').length;
    const pending = expenses.filter(e => e.status === 'pending').length;
    const buildReceiptUrl = (expense) => {
        if (expense.receipt_file) {
            return `${api.defaults.baseURL}/${expense.receipt_file}`;
        }
        return expense.receipt_url || '';
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Expenses</h1>
                        <p className="text-sm text-gray-500 mt-1">{expenses.length} total expenses</p>
                    </div>
                    <a href="/expenses/submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
                        + New Expense
                    </a>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[['Total', `$${total.toFixed(2)}`, 'bg-indigo-50 text-indigo-700'], ['Approved', approved, 'bg-green-50 text-green-700'], ['Pending', pending, 'bg-yellow-50 text-yellow-700']].map(([label, val, color]) => (
                        <div key={label} className={`rounded-xl p-4 border ${color.replace('text', 'border').replace('-700', '-200')}`}>
                            <p className={`text-xs font-medium uppercase tracking-wide ${color.split(' ')[1]}`}>{label}</p>
                            <p className="text-2xl font-bold mt-1 text-gray-800">{val}</p>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                ) : expenses.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 text-center py-16 text-gray-400">
                        <div className="text-4xl mb-3">🧾</div>
                        <p>No expenses yet. <a href="/expenses/submit" className="text-indigo-600 hover:underline">Submit your first one →</a></p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Category</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Description</th>
                                        <th className="text-right px-5 py-3 font-semibold text-gray-600">Amount</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Manager Approval</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Finance Approval</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Director Approval</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600 whitespace-nowrap">Actions</th>
                                        <th className="text-center px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">View Details</th>
                                        <th className="text-center px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Receipts</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {expenses.map(e => (
                                        <tr key={e.id} className="hover:bg-gray-50 transition">
                                            <td className="px-5 py-3 text-gray-500">{e.expense_date}</td>
                                            <td className="px-5 py-3 font-medium">{e.category}</td>
                                            <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{e.description || '—'}</td>
                                            <td className="px-5 py-3 text-right font-mono font-medium">{e.original_amount.toFixed(2)} {e.currency}</td>
                                            <td className="px-5 py-3">
                                                {(() => {
                                                    const step = e.approval_steps?.find(s => s.approver_role === 'manager');
                                                    if (!step) return <span className="text-xs text-gray-400">—</span>;
                                                    const cls = step.status === 'approved' ? 'bg-green-100 text-green-700' : step.status === 'rejected' ? 'bg-red-100 text-red-700' : step.status === 'waiting' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700';
                                                    return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cls}`}>{step.status}</span>;
                                                })()}
                                            </td>
                                            <td className="px-5 py-3">
                                                {(() => {
                                                    const step = e.approval_steps?.find(s => s.approver_role === 'finance');
                                                    if (!step) return <span className="text-xs text-gray-400">—</span>;
                                                    const cls = step.status === 'approved' ? 'bg-green-100 text-green-700' : step.status === 'rejected' ? 'bg-red-100 text-red-700' : step.status === 'waiting' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700';
                                                    return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cls}`}>{step.status}</span>;
                                                })()}
                                            </td>
                                            <td className="px-5 py-3">
                                                {(() => {
                                                    const step = e.approval_steps?.find(s => s.approver_role === 'director');
                                                    if (!step) return <span className="text-xs text-gray-400">—</span>;
                                                    const cls = step.status === 'approved' ? 'bg-green-100 text-green-700' : step.status === 'rejected' ? 'bg-red-100 text-red-700' : step.status === 'waiting' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700';
                                                    return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cls}`}>{step.status}</span>;
                                                })()}
                                            </td>
                                            <td className="px-5 py-3">
                                                {e.status === 'draft' ? (
                                                    <button
                                                        onClick={() => handleSubmit(e.id)}
                                                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition font-medium"
                                                    >
                                                        Submit
                                                    </button>
                                                ) : (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium capitalize">
                                                        {e.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Link
                                                    to={`/expense/${e.id}`}
                                                    className="inline-flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium whitespace-nowrap"
                                                >
                                                    View
                                                    <span aria-hidden="true">→</span>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {buildReceiptUrl(e) ? (
                                                    <a
                                                        href={buildReceiptUrl(e)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center justify-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium whitespace-nowrap"
                                                    >
                                                        Receipt
                                                        <span aria-hidden="true">↗</span>
                                                    </a>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap">
                                                        No receipt
                                                    </span>
                                                )}
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

export default MyExpenses;
