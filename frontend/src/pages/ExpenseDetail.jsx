import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import AppLayout from '../components/AppLayout';
import { getExpenseById } from '../api/expensesApi';
import StatusBadge from '../components/StatusBadge';
import api from '../api/axios';

const ExpenseDetail = () => {
    const { id } = useParams();
    const [expense, setExpense] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await getExpenseById(id);
                setExpense(res.data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load expense.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const receiptUrl = expense?.receipt_file
        ? `${api.defaults.baseURL}/${expense.receipt_file}`
        : expense?.receipt_url;

    return (
        <AppLayout>
            <div className="max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Expense Detail</h1>
                        <p className="text-sm text-gray-500 mt-1">Track approval history for this request.</p>
                    </div>
                    <Link to="/expenses/my" className="text-sm text-indigo-600 hover:underline">Back to My Expenses</Link>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                ) : expense ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Employee</p>
                                <p className="text-lg font-semibold text-gray-900">{expense.employee_name || 'Employee'}</p>
                            </div>
                            <StatusBadge status={expense.status} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div><span className="text-gray-500">Amount:</span> {expense.original_amount.toFixed(2)} {expense.currency}</div>
                            <div><span className="text-gray-500">Category:</span> {expense.category}</div>
                            <div><span className="text-gray-500">Date:</span> {expense.expense_date}</div>
                            <div><span className="text-gray-500">Description:</span> {expense.description || '—'}</div>
                        </div>

                        {receiptUrl && (
                            <div>
                                <button onClick={() => window.open(receiptUrl, '_blank')} className="text-sm text-indigo-600 hover:underline">View Receipt</button>
                            </div>
                        )}

                        <div>
                            <h2 className="text-base font-semibold text-gray-800 mb-3">Approval History</h2>
                            {expense.approval_steps?.length ? (
                                <div className="space-y-3">
                                    {expense.approval_steps.map(step => (
                                        <div key={step.id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{step.approver_name || 'Approver'}</p>
                                                <p className="text-xs text-gray-500">Step {step.step_order}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-medium capitalize">{step.status}</span>
                                                {step.comment && <p className="text-xs text-gray-500 mt-1">{step.comment}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No approval history yet.</p>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </AppLayout>
    );
};

export default ExpenseDetail;
