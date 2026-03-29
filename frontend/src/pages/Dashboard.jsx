import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

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
                
                <div className="mt-8">
                    {user?.role === 'admin' && (
                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-lg transition-all hover:shadow-md">
                            <h2 className="text-xl font-semibold mb-2 text-indigo-900">User Management</h2>
                            <p className="text-indigo-700 mb-4">Manage users, adjust roles, and configure company settings across the entire platform.</p>
                            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg transition-colors shadow-sm font-medium">Manage Users</button>
                        </div>
                    )}
                    {user?.role === 'manager' && (
                        <div className="bg-teal-50 border border-teal-100 p-6 rounded-lg transition-all hover:shadow-md">
                            <h2 className="text-xl font-semibold mb-2 text-teal-900">Pending Approvals</h2>
                            <p className="text-teal-700 mb-4">Review, approve, or reject employee reimbursement claims and expenses.</p>
                            <button className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg transition-colors shadow-sm font-medium">View Pending Expenses</button>
                        </div>
                    )}
                    {user?.role === 'employee' && (
                        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-lg transition-all hover:shadow-md">
                            <h2 className="text-xl font-semibold mb-2 text-emerald-900">Submit Expense</h2>
                            <p className="text-emerald-700 mb-4">File new mileage claims, upload receipts, and manage your past submissions.</p>
                            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg transition-colors shadow-sm font-medium">Submit New Expense</button>
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
