import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getMyCompany, updateCompany, getCurrencyRates, getCountries } from '../api/companyApi';
import AppLayout from '../components/AppLayout';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'SGD', 'AED', 'CHF'];

const CompanyProfile = () => {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === 'admin';

    const [company, setCompany] = useState(null);
    const [countries, setCountries] = useState([]);
    const [rates, setRates] = useState(null);
    const [loadingRates, setLoadingRates] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', country: '', base_currency: '' });
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [cRes, ctRes] = await Promise.all([getMyCompany(), getCountries()]);
                setCompany(cRes.data);
                setForm({ name: cRes.data.name, country: cRes.data.country, base_currency: cRes.data.base_currency });
                const unique = [...new Set(ctRes.data.map(c => c.country))].sort();
                setCountries(unique);
            } catch { setError('Failed to load company data.'); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const fetchRates = async () => {
        setLoadingRates(true);
        try { const r = await getCurrencyRates(); setRates(r.data); }
        catch { setError('Failed to load exchange rates.'); }
        finally { setLoadingRates(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true); setError(''); setSuccess('');
        try {
            const res = await updateCompany(form);
            setCompany(res.data); setEditing(false);
            setSuccess('Company updated!'); setTimeout(() => setSuccess(''), 3000);
        } catch (err) { setError(err.response?.data?.detail || 'Failed to update.'); }
        finally { setSaving(false); }
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your company profile and currency preferences.</p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

                {loading ? (
                    <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-gray-800">Company Details</h2>
                            {isAdmin && !editing && (
                                <button onClick={() => setEditing(true)} className="text-sm text-indigo-600 border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50 transition font-medium">Edit</button>
                            )}
                        </div>

                        {!editing ? (
                            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[['Company Name', company?.name], ['Country', company?.country], ['Base Currency', company?.base_currency]].map(([label, value]) => (
                                    <div key={label} className="bg-gray-50 rounded-lg p-4">
                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
                                        <dd className="mt-1 text-base font-semibold text-gray-900">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-4 max-w-xl">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <select value={form.country} onChange={e => setForm({...form, country: e.target.value})} required className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="">-- Select --</option>
                                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Currency</label>
                                    <select value={form.base_currency} onChange={e => setForm({...form, base_currency: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="submit" disabled={saving} className={`bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition ${saving ? 'opacity-60' : ''}`}>{saving ? 'Saving...' : 'Save Changes'}</button>
                                    <button type="button" onClick={() => setEditing(false)} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Exchange Rates */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Exchange Rates <span className="text-sm font-normal text-gray-400">(Base: {company?.base_currency})</span></h2>
                        <button onClick={fetchRates} disabled={loadingRates} className={`text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-1.5 rounded-lg hover:bg-indigo-100 transition font-medium ${loadingRates ? 'opacity-60' : ''}`}>{loadingRates ? 'Loading...' : rates ? 'Refresh' : 'Load Rates'}</button>
                    </div>
                    {rates ? (
                        <div className="overflow-auto max-h-64 rounded-lg border border-gray-100">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0"><tr><th className="text-left px-4 py-2.5 font-semibold text-gray-600">Currency</th><th className="text-right px-4 py-2.5 font-semibold text-gray-600">Rate</th></tr></thead>
                                <tbody className="divide-y divide-gray-100">
                                    {Object.entries(rates.rates || {}).map(([cur, rate]) => (
                                        <tr key={cur} className="hover:bg-gray-50"><td className="px-4 py-2 font-mono">{cur}</td><td className="px-4 py-2 text-right font-medium">{Number(rate).toFixed(4)}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400 text-sm">Click "Load Rates" to fetch live exchange rates.</div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default CompanyProfile;
