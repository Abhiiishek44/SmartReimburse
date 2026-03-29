import { useState, useContext, useEffect } from 'react';
import { Eye, EyeOff, Wallet, User, Mail, Lock, Building2, Globe, ArrowRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, Navigate } from 'react-router';

const PASSWORD_RULES = [
    { label: 'At least 8 characters',  test: (p) => p.length >= 8 },
    { label: 'One uppercase letter',    test: (p) => /[A-Z]/.test(p) },
    { label: 'One special character',   test: (p) => /[^A-Za-z0-9]/.test(p) },
    { label: 'No spaces or underscores', test: (p) => !/[ _]/.test(p) },
];

const validatePassword = (pwd) => {
    for (const rule of PASSWORD_RULES) {
        if (!rule.test(pwd)) return `Password: ${rule.label.toLowerCase()}.`;
    }
    return null;
};

const FALLBACK_CURRENCIES = [
    { code: 'USD', name: 'US Dollar',       symbol: '$'   },
    { code: 'EUR', name: 'Euro',            symbol: '€'   },
    { code: 'GBP', name: 'British Pound',   symbol: '£'   },
    { code: 'INR', name: 'Indian Rupee',    symbol: '₹'   },
    { code: 'JPY', name: 'Japanese Yen',    symbol: '¥'   },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc',     symbol: 'Fr'  },
    { code: 'CNY', name: 'Chinese Yuan',    symbol: '¥'   },
    { code: 'AED', name: 'UAE Dirham',      symbol: 'د.إ' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

const Signup = () => {
    const { signup, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        user_name: '',
        email: '',
        password: '',
        company_name: '',
        country: '',
        base_currency: 'USD',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [currencies, setCurrencies] = useState(FALLBACK_CURRENCIES);

    // Load live currencies from restcountries.com on mount
    useEffect(() => {
        fetch('https://restcountries.com/v3.1/all?fields=name,currencies')
            .then((r) => r.json())
            .then((data) => {
                const seen = new Set();
                const list = [];
                data.forEach((c) => {
                    Object.entries(c.currencies || {}).forEach(([code, info]) => {
                        if (!seen.has(code)) {
                            seen.add(code);
                            list.push({ code, name: info.name || code, symbol: info.symbol || '' });
                        }
                    });
                });
                list.sort((a, b) => a.code.localeCompare(b.code));
                if (list.length) setCurrencies(list);
            })
            .catch(() => {}); // silently keep fallback
    }, []);

    if (user) return <Navigate to="/dashboard" replace />;

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const pwdError = validatePassword(formData.password);
        if (pwdError) { setError(pwdError); return; }

        setLoading(true);
        try {
            await signup(formData);
            navigate('/login');
        } catch (err) {
            if (!err.response) {
                setError('Cannot reach the server. Make sure the backend is running on port 8000.');
            } else {
                const detail = err.response?.data?.detail;
                if (Array.isArray(detail)) {
                    // FastAPI validation errors — array of { loc, msg, type }
                    const messages = detail.map((d) => {
                        const field = d.loc?.slice(1).join(' → ') || 'field';
                        return `${field}: ${d.msg}`;
                    });
                    setError(messages.join('\n'));
                } else if (typeof detail === 'string') {
                    setError(detail);
                } else {
                    setError(`Signup failed (${err.response.status}). Please try again.`);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white";

    return (
        <div className="min-h-screen flex">
            {/* Left branding panel */}
            <div className="hidden lg:flex lg:w-5/12 bg-indigo-600 flex-col justify-between p-12 relative overflow-hidden">
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
                        Set up your<br />company in minutes.
                    </h1>
                    <p className="text-indigo-200 text-lg leading-relaxed">
                        One admin account to manage your entire team's expense workflow from day one.
                    </p>
                    <div className="mt-10 space-y-4">
                        {['Invite employees after setup', 'Role-based access control', 'Approval workflows built-in'].map((item) => (
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
            <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12 overflow-y-auto">
                <div className="w-full max-w-lg">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <div className="bg-indigo-600 p-2 rounded-xl">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-gray-900">SmartReimburse</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
                        <p className="text-gray-500 mt-1 text-sm">
                            Already registered?{' '}
                            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-500 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error block — handles both single string and multi-line validation errors */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                                <span className="mt-0.5 shrink-0">⚠</span>
                                <div className="flex-1">
                                    {error.includes('\n') ? (
                                        <ul className="space-y-0.5 list-disc list-inside">
                                            {error.split('\n').map((line, i) => <li key={i}>{line}</li>)}
                                        </ul>
                                    ) : error}
                                </div>
                            </div>
                        )}

                        {/* Company Details */}
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Company Details</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input name="company_name" type="text" required placeholder="Acme Corp"
                                            value={formData.company_name} onChange={handleChange} className={inputCls} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input name="country" type="text" required placeholder="United States"
                                            value={formData.country} onChange={handleChange} className={inputCls} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live currency dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Currency</label>
                            <select name="base_currency" required value={formData.base_currency} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all">
                                {currencies.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} — {c.name}{c.symbol ? ` (${c.symbol})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="border-t border-gray-200 pt-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Admin Account</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input name="user_name" type="text" required placeholder="Jane Smith"
                                    value={formData.user_name} onChange={handleChange} className={inputCls} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input name="email" type="email" required placeholder="jane@company.com"
                                    autoComplete="email" value={formData.email} onChange={handleChange} className={inputCls} />
                            </div>
                        </div>

                        {/* Password with show/hide + live strength checklist */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required autoComplete="new-password"
                                    placeholder="Create a strong password"
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

                            {/* Live password checklist */}
                            {formData.password && (
                                <ul className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1">
                                    {PASSWORD_RULES.map(({ label, test }) => (
                                        <li key={label} className={`text-xs flex items-center gap-1.5 ${test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                            <span className="text-base leading-none">{test(formData.password) ? '✓' : '○'}</span>
                                            {label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-2">
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>Create account <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;
