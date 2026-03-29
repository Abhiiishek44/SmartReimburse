import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { getDashboardStats } from '../api/adminApi';
import ApprovalRules from './ApprovalRules';
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

const TABS = ['overview', 'rules'];

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
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
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your company, users, and approval workflows.</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="flex gap-6">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-medium capitalize transition border-b-2 -mb-px ${
                                    activeTab === tab
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab === 'overview' ? '📊 Overview' : '📋 Approval Rules'}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {loadingStats ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatCard label="Total Employees" value={stats?.total_employees} icon="👤" color="bg-blue-50" />
                                <StatCard label="Total Managers" value={stats?.total_managers} icon="🧑‍💼" color="bg-purple-50" />
                                <StatCard label="Approval Rules" value={stats?.total_rules} icon="📋" color="bg-indigo-50" />
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => setActiveTab('rules')}
                                    className="flex items-center gap-3 p-4 rounded-lg border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 transition text-left"
                                >
                                    <span className="text-2xl">📋</span>
                                    <div>
                                        <p className="font-medium text-indigo-800 text-sm">Manage Approval Rules</p>
                                        <p className="text-xs text-indigo-600">Create and edit approval workflows</p>
                                    </div>
                                </button>
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
                            </div>
                        </div>

                        {/* Business Logic Reference */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-base font-semibold text-gray-800 mb-4">Approval Logic Reference</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                    <p className="font-semibold text-blue-800 mb-2">🔗 Sequential Flow</p>
                                    <p className="text-blue-700 text-xs mb-2">Approval goes step by step:</p>
                                    <div className="font-mono text-xs text-blue-800 space-y-1">
                                        <div>Step 1 → Manager</div>
                                        <div>Step 2 → Finance</div>
                                        <div>Step 3 → Director</div>
                                    </div>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                    <p className="font-semibold text-amber-800 mb-2">⚡ Parallel Flow</p>
                                    <p className="text-amber-700 text-xs mb-2">All notified at once. Approved when min % reached:</p>
                                    <div className="font-mono text-xs text-amber-800 space-y-1">
                                        <div>Finance + Director + CFO</div>
                                        <div>Min: 60% → 2/3 approve → ✅</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Approval Rules Tab */}
                {activeTab === 'rules' && <ApprovalRules />}
            </div>
        </AppLayout>
    );
};

export default AdminDashboard;
