import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router';
import { getManagerPendingApprovals } from '../api/expensesApi';
import StatusBadge from '../components/StatusBadge';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [loadingApprovals, setLoadingApprovals] = useState(false);
    const [approvalsError, setApprovalsError] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        if (user?.role !== 'manager') return;
        const load = async () => {
            setLoadingApprovals(true);
            setApprovalsError('');
            try {
                const res = await getManagerPendingApprovals();
                setPendingApprovals(res.data || []);
            } catch (err) {
                setApprovalsError(err.response?.data?.detail || 'Failed to load pending approvals.');
            } finally {
                setLoadingApprovals(false);
            }
        };
        load();
    }, [user?.role]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12">
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <p className="text-2xl font-semibold text-gray-800">Welcome, {user?.name}</p>
                        <p className="text-gray-500 mt-1">{user?.email}</p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium capitalize">
                        {user?.role}
                    </span>
                </div>
                
                <div className="mt-8 space-y-4">
                    {user?.role === 'admin' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link to="/admin" className="bg-indigo-50 border border-indigo-100 p-6 rounded-lg transition-all hover:shadow-md">
                                <h2 className="text-lg font-semibold mb-2 text-indigo-900">Admin Dashboard</h2>
                                <p className="text-indigo-700">Overview of company stats.</p>
                            </Link>
                            <Link to="/company" className="bg-white border border-gray-100 p-6 rounded-lg transition-all hover:shadow-md">
                                <h2 className="text-lg font-semibold mb-2 text-gray-900">Company Profile</h2>
                                <p className="text-gray-600">Update company details.</p>
                            </Link>
                            <Link to="/users" className="bg-white border border-gray-100 p-6 rounded-lg transition-all hover:shadow-md">
                                <h2 className="text-lg font-semibold mb-2 text-gray-900">User Management</h2>
                                <p className="text-gray-600">Create managers and employees.</p>
                            </Link>
                            <Link to="/expenses/all" className="bg-white border border-gray-100 p-6 rounded-lg transition-all hover:shadow-md">
                                <h2 className="text-lg font-semibold mb-2 text-gray-900">All Expenses</h2>
                                <p className="text-gray-600">Review every expense.</p>
                            </Link>
                        </div>
                    )}
                    {user?.role === 'manager' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Link to="/manager/approvals" className="bg-teal-50 border border-teal-100 p-6 rounded-lg transition-all hover:shadow-md">
                                    <h2 className="text-lg font-semibold mb-2 text-teal-900">Pending Approvals</h2>
                                    <p className="text-teal-700">Review employee requests.</p>
                                </Link>
                                <Link to="/expenses/team" className="bg-white border border-gray-100 p-6 rounded-lg transition-all hover:shadow-md">
                                    <h2 className="text-lg font-semibold mb-2 text-gray-900">Team Expenses</h2>
                                    <p className="text-gray-600">Track team reimbursements.</p>
                                </Link>
                                <Link to="/expenses/my" className="bg-white border border-gray-100 p-6 rounded-lg transition-all hover:shadow-md">
                                    <h2 className="text-lg font-semibold mb-2 text-gray-900">My Expenses</h2>
                                    <p className="text-gray-600">View your submissions.</p>
                                </Link>
                                <Link to="/expenses/submit" className="bg-white border border-gray-100 p-6 rounded-lg transition-all hover:shadow-md">
                                    <h2 className="text-lg font-semibold mb-2 text-gray-900">Submit Expense</h2>
                                    <p className="text-gray-600">Upload a new receipt.</p>
                                </Link>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-semibold text-gray-800">Pending Approvals</h3>
                                    <span className="text-xs text-gray-500">{pendingApprovals.length} pending</span>
                                </div>
                                {approvalsError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">
                                        {approvalsError}
                                    </div>
                                )}
                                {loadingApprovals ? (
                                    <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" /></div>
                                ) : pendingApprovals.length === 0 ? (
                                    <div className="text-sm text-gray-500">No pending approvals right now.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {pendingApprovals.slice(0, 3).map(exp => (
                                            <div key={exp.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-3 py-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{exp.employee_name || 'Employee'}</p>
                                                    <p className="text-xs text-gray-500">{exp.category} • {exp.expense_date}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-gray-800">{exp.original_amount.toFixed(2)} {exp.currency}</p>
                                                    <StatusBadge status={exp.status} />
                                                </div>
                                            </div>
                                        ))}
                                        {pendingApprovals.length > 3 && (
                                            <div className="text-xs text-teal-600">+{pendingApprovals.length - 3} more pending approvals</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {user?.role === 'employee' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link to="/expenses/submit" className="bg-emerald-50 border border-emerald-100 p-6 rounded-lg transition-all hover:shadow-md">
                                <h2 className="text-lg font-semibold mb-2 text-emerald-900">Submit Expense</h2>
                                <p className="text-emerald-700">Upload receipts and requests.</p>
                            </Link>
                            <Link to="/expenses/my" className="bg-white border border-gray-100 p-6 rounded-lg transition-all hover:shadow-md">
                                <h2 className="text-lg font-semibold mb-2 text-gray-900">My Expenses</h2>
                                <p className="text-gray-600">Track your submissions.</p>
                            </Link>
                        </div>
                    )}
                    {user?.role === 'finance' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link to="/finance/dashboard" className="bg-amber-50 border border-amber-100 p-6 rounded-lg transition-all hover:shadow-md">
                                <h2 className="text-lg font-semibold mb-2 text-amber-900">Finance Approvals</h2>
                                <p className="text-amber-700">Review pending reimbursements.</p>
                            </Link>
                            <Link to="/expenses/team" className="bg-white border border-gray-100 p-6 rounded-lg transition-all hover:shadow-md">
                                <h2 className="text-lg font-semibold mb-2 text-gray-900">Team Expenses</h2>
                                <p className="text-gray-600">View team submissions.</p>
                            </Link>
                        </div>
                    )}
                    {user?.role === 'director' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link to="/director/dashboard" className="bg-orange-50 border border-orange-100 p-6 rounded-lg transition-all hover:shadow-md">
                                <h2 className="text-lg font-semibold mb-2 text-orange-900">Director Approvals</h2>
                                <p className="text-orange-700">Approve critical expenses.</p>
                            </Link>
                            <Link to="/expenses/team" className="bg-white border border-gray-100 p-6 rounded-lg transition-all hover:shadow-md">
                                <h2 className="text-lg font-semibold mb-2 text-gray-900">Team Expenses</h2>
                                <p className="text-gray-600">View all team submissions.</p>
                            </Link>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={handleLogout}
                    className="mt-10 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-lg w-full transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
