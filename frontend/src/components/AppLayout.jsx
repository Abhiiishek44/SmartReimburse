import { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { AuthContext } from '../context/AuthContext';

const navByRole = {
    admin: [
        { to: '/admin', label: '📊 Dashboard' },
        { to: '/company', label: '🏢 Company' },
        { to: '/users', label: '👥 Users' },
        { to: '/admin/approval-settings', label: '✅ Approval Settings' },
        { to: '/expenses/all', label: '🧾 All Expenses' },
    ],
    manager: [
        { to: '/manager/approvals', label: '✅ Manager Approvals' },
        { to: '/expenses/team', label: '👥 Team Expenses' },
        { to: '/expenses/my', label: '🧾 My Expenses' },
        { to: '/expenses/submit', label: '➕ Submit Expense' },
    ],
    finance: [
        { to: '/finance/dashboard', label: '💰 Finance Approvals' },
        { to: '/expenses/team', label: '👥 Team Expenses' },
    ],
    director: [
        { to: '/director/dashboard', label: '🏛️ Director Approvals' },
        { to: '/expenses/team', label: '👥 Team Expenses' },
    ],
    employee: [
        { to: '/expenses/submit', label: '➕ Submit Expense' },
        { to: '/expenses/my', label: '🧾 My Expenses' },
    ],
};

const AppLayout = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => { logout(); navigate('/login'); };
    const links = navByRole[user?.role] || [];

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link to={user?.role === 'admin' ? '/admin' : '/expenses/my'} className="font-bold text-indigo-600 text-lg tracking-tight">
                            SmartReimburse
                        </Link>
                        <nav className="hidden md:flex items-center gap-1">
                            {links.map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                        location.pathname === link.to
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 hidden sm:block">{user?.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                            user?.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            user?.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                            user?.role === 'finance' ? 'bg-amber-100 text-amber-700' :
                            user?.role === 'director' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                        }`}>{user?.role}</span>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1.5 rounded-full shadow-sm hover:from-rose-600 hover:to-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 transition"
                        >
                            <span className="text-base">⎋</span>
                            Logout
                        </button>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {children}
            </main>
        </div>
    );
};

export default AppLayout;
