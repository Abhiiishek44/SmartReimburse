import { useState, useEffect } from 'react';
import { getAllExpenses, getTeamExpenses } from '../api/expensesApi';
import api from '../api/axios';
import AppLayout from '../components/AppLayout';
import StatusBadge from '../components/StatusBadge';

const ExpenseListPage = ({ mode }) => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const r = mode === 'all' ? await getAllExpenses() : await getTeamExpenses();
                setExpenses(r.data);
            } catch { setError('Failed to load expenses.'); }
            finally { setLoading(false); }
        };
        load();
    }, [mode]);

    const filtered = filter === 'all' ? expenses : expenses.filter(e => e.status === filter);
    const STATUSES = ['all', 'draft', 'pending', 'approved', 'rejected', 'reimbursed'];
    const buildReceiptUrl = (expense) => {
        if (expense.receipt_file) {
            return `${api.defaults.baseURL}/${expense.receipt_file}`;
        }
        return expense.receipt_url || '';
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{mode === 'all' ? 'All Company Expenses' : 'Team Expenses'}</h1>
                    <p className="text-sm text-gray-500 mt-1">{expenses.length} total expenses</p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2">
                    {STATUSES.map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            {s} {s !== 'all' && `(${expenses.filter(e => e.status === s).length})`}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 text-center py-16 text-gray-400">No expenses found.</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Employee</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Category</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Description</th>
                                        <th className="text-right px-5 py-3 font-semibold text-gray-600">Amount</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Receipt</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Approval</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map(e => (
                                        <tr key={e.id} className="hover:bg-gray-50 transition">
                                            <td className="px-5 py-3 font-medium text-gray-800">{e.employee_name || '—'}</td>
                                            <td className="px-5 py-3 text-gray-500">{e.expense_date}</td>
                                            <td className="px-5 py-3">{e.category}</td>
                                            <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{e.description || '—'}</td>
                                            <td className="px-5 py-3 text-right font-mono font-medium">{e.original_amount.toFixed(2)} {e.currency}</td>
                                            <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                                            <td className="px-5 py-3">
                                                {buildReceiptUrl(e) ? (
                                                    <a href={buildReceiptUrl(e)} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">View</a>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {e.approval_steps?.map(step => (
                                                        <span key={step.id} className={`text-xs px-1.5 py-0.5 rounded font-medium ${step.status === 'approved' ? 'bg-green-100 text-green-700' : step.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            S{step.step_order}:{step.status.charAt(0).toUpperCase()}
                                                        </span>
                                                    ))}
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

export default ExpenseListPage;
