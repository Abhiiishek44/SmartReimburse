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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <StatCard label="Total Employees" value={stats?.total_employees} icon="👤" color="bg-blue-50" />
                            <StatCard label="Total Managers" value={stats?.total_managers} icon="🧑‍💼" color="bg-purple-50" />
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            >
                                <span className="text-2xl">🏠</span>
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">Go to Dashboard</p>
                                    <p className="text-xs text-gray-500">View main app dashboard</p>
                                </div>
                            </Link>
                            <Link
                                to="/users"
                                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                            >
                                <span className="text-2xl">👥</span>
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">Manage Users</p>
                                    <p className="text-xs text-gray-500">Invite or update roles</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default AdminDashboard;
