import { useState, useContext } from 'react';
import { Eye, EyeOff, Wallet, Mail, Lock, ArrowRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, Navigate } from 'react-router';

const Login = () => {
    const { login, user, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Wait for auth check before rendering — prevents flash redirect
    if (authLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const loggedInUser = await login(formData.email, formData.password);
            navigate(loggedInUser.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            if (!err.response) {
                setError('Cannot reach the server. Make sure the backend is running on port 8000.');
            } else {
                const detail = err.response?.data?.detail;
                if (Array.isArray(detail)) {
                    setError(detail.map((d) => `${d.loc?.slice(1).join('.')}: ${d.msg}`).join('\n'));
                } else {
                    setError(detail || 'Invalid email or password. Please try again.');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left branding panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full opacity-40" />
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-700 rounded-full opacity-50 translate-x-1/3 translate-y-1/3" />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-400 rounded-full opacity-20 -translate-x-1/2 -translate-y-1/2" />
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight">SmartReimburse</span>
                </div>

                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                        Manage expenses<br />without the mess.
                    </h1>
                    <p className="text-indigo-200 text-lg leading-relaxed">
                        Submit, track, and approve reimbursements in one clean dashboard. No spreadsheets, no paper trails.
                    </p>
                    <div className="mt-10 space-y-4">
                        {['Submit expenses in seconds', 'Real-time approval tracking', 'Multi-currency support'].map((item) => (
                            <div key={item} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                                <span className="text-indigo-100 text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative z-10 text-indigo-300 text-xs">
                    © {new Date().getFullYear()} SmartReimburse Inc.
                </p>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="bg-indigo-600 p-2 rounded-xl">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-gray-900">SmartReimburse</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
                        <p className="text-gray-500 mt-1 text-sm">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-indigo-600 font-medium hover:text-indigo-500 transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                                <span className="mt-0.5 shrink-0">⚠</span>
                                <div className="flex-1">
                                    {error.includes('\n')
                                        ? <ul className="space-y-0.5 list-disc list-inside">{error.split('\n').map((l, i) => <li key={i}>{l}</li>)}</ul>
                                        : error
                                    }
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    name="email" type="email" required autoComplete="email"
                                    placeholder="you@company.com"
                                    value={formData.email} onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required autoComplete="current-password"
                                    placeholder="Your password"
                                    value={formData.password} onChange={handleChange}
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                                />
                                <button
                                    type="button" tabIndex={-1}
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>Sign in <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
