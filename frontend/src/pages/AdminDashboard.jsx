import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getDashboardStats } from '../api/adminApi';
import AppLayout from '../components/AppLayout';

const StatCard = ({ label, value, icon, color }) => (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        getDashboardStats()
            .then(res => setStats(res.data))
            .catch(() => {})
            .finally(() => setLoadingStats(false));
    }, []);

    return (
        <AppLayout>
            <div className="space-y-6 text-left">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your company, users, and approval workflows.</p>
                </div>
                {/* Overview */}
                <div className="space-y-6">
                    {loadingStats ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatCard label="Total Employees" value={stats?.total_employees} icon="👤" color="bg-blue-50" />
                            <StatCard label="Total Managers" value={stats?.total_managers} icon="🧑‍💼" color="bg-purple-50" />
                            <StatCard label="Total Users" value={(stats?.total_employees ?? 0) + (stats?.total_managers ?? 0)} icon="👥" color="bg-indigo-50" />
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Links</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <Link
                                to="/users"
                                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            >
                                <span className="text-2xl">👥</span>
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">User Management</p>
                                    <p className="text-xs text-gray-500">Invite or update roles</p>
                                </div>
                            </Link>
                            <Link
                                to="/company"
                                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            >
                                <span className="text-2xl">🏢</span>
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">Company Profile</p>
                                    <p className="text-xs text-gray-500">Edit company settings</p>
                                </div>
                            </Link>
                            <Link
                                to="/expenses/all"
                                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            >
                                <span className="text-2xl">🧾</span>
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">All Expenses</p>
                                    <p className="text-xs text-gray-500">Review submissions</p>
                                </div>
                            </Link>
                            <Link
                                to="/admin/approval-settings"
                                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            >
                                <span className="text-2xl">✅</span>
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">Approval Settings</p>
                                    <p className="text-xs text-gray-500">Configure approval flow</p>
                                </div>
                            </Link>
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            >
                                <span className="text-2xl">🏠</span>
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">Main Dashboard</p>
                                    <p className="text-xs text-gray-500">Role-based overview</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-base font-semibold text-gray-800 mb-4">Admin Checklist</h2>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center gap-2"><span className="text-emerald-500">●</span>Create managers and employees</li>
                            <li className="flex items-center gap-2"><span className="text-emerald-500">●</span>Assign managers to employees</li>
                            <li className="flex items-center gap-2"><span className="text-emerald-500">●</span>Monitor reimbursements</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default AdminDashboard;
