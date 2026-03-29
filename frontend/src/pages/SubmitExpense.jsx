import { useState } from 'react';
import { createExpense, submitExpense } from '../api/expensesApi';
import { useNavigate } from 'react-router';
import AppLayout from '../components/AppLayout';
import OCRUpload from '../components/OCRUpload';

const CATEGORIES = ['Travel', 'Meals', 'Accommodation', 'Equipment', 'Software', 'Training', 'Medical', 'Other'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'SGD', 'AED'];
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const SubmitExpense = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        original_amount: '',
        currency: 'USD',
        category: 'Travel',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
    });
    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptError, setReceiptError] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState('form'); // form | confirm

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        applyReceiptFile(file);
    };

    // Shared file validation used by both manual picker and OCR component
    const applyReceiptFile = (file) => {
        if (!file) { setReceiptFile(null); setReceiptError(''); return; }
        if (!ALLOWED_TYPES.includes(file.type)) {
            setReceiptFile(null);
            setReceiptError('Only JPG, PNG, or PDF files are allowed.');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setReceiptFile(null);
            setReceiptError('File size must be 5MB or less.');
            return;
        }
        setReceiptError('');
        setReceiptFile(file);
    };

    // Called by OCRUpload when scan succeeds — merge extracted fields into form
    const handleOCRExtracted = (data) => {
        setForm((prev) => ({
            ...prev,
            original_amount: data.amount != null ? String(data.amount) : prev.original_amount,
            expense_date:    data.date     || prev.expense_date,
            category:        CATEGORIES.includes(data.category) ? data.category : prev.category,
            description:     data.vendor
                ? `${data.vendor}${data.description ? ' — ' + data.description : ''}`
                : (data.description || prev.description),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step === 'form') { setStep('confirm'); return; }
        if (!receiptFile) {
            setError('Please attach a receipt file before submitting.');
            setStep('form');
            return;
        }

    setSaving(true); setError('');
        try {
            const formData = new FormData();
            formData.append('original_amount', form.original_amount);
            formData.append('currency', form.currency);
            formData.append('category', form.category);
            formData.append('description', form.description || '');
            formData.append('expense_date', form.expense_date);
            formData.append('file', receiptFile);

            const res = await createExpense(formData);
            await submitExpense(res.data.id);
            navigate('/expenses/my');
        } catch (err) {
            const detail = err.response?.data?.detail || err.response?.data?.message;
            const fallback = err.request && !err.response
                ? 'Could not reach the server. Ensure the backend is running and try again.'
                : (err.message || 'Failed to submit expense.');
            setError(detail || fallback);
            setStep('form');
        } finally { setSaving(false); }
    };

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Submit Expense</h1>
                    <p className="text-sm text-gray-500 mt-1">Fill in the details and submit for approval.</p>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

                {step === 'confirm' ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800">Confirm Submission</h2>
                        <dl className="space-y-3">
                            {[['Amount', `${form.original_amount} ${form.currency}`], ['Category', form.category], ['Date', form.expense_date], ['Description', form.description || '—'], ['Receipt', receiptFile?.name || '—']].map(([k, v]) => (
                                <div key={k} className="flex justify-between text-sm">
                                    <dt className="text-gray-500">{k}</dt>
                                    <dd className="font-medium text-gray-800">{v}</dd>
                                </div>
                            ))}
                        </dl>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                            Once submitted, this expense will be sent for approval. You cannot edit it after submission.
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={handleSubmit} disabled={saving} className={`bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition ${saving ? 'opacity-60' : ''}`}>{saving ? 'Submitting...' : 'Confirm & Submit'}</button>
                            <button onClick={() => setStep('form')} className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Back to Edit</button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        {/* ── OCR Scanner ─────────────────────────────────── */}
                        <OCRUpload
                            onExtracted={handleOCRExtracted}
                            onFileSelected={applyReceiptFile}
                        />

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                    <input name="original_amount" type="number" step="0.01" min="0.01" required value={form.original_amount} onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
                                    <select name="currency" value={form.currency} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                    <select name="category" value={form.category} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date *</label>
                                    <input name="expense_date" type="date" required value={form.expense_date} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea name="description" rows={3} value={form.description} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Describe the expense..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt File (JPG, PNG, PDF) *</label>
                                <input name="receipt_file" type="file" accept=".jpg,.jpeg,.png,.pdf" required onChange={handleFileChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                                {receiptError && <p className="text-xs text-red-600 mt-1">{receiptError}</p>}
                                {!receiptError && receiptFile && (
                                    <p className="text-xs text-gray-500 mt-1">Selected: {receiptFile.name}</p>
                                )}
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                                Review & Submit →
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default SubmitExpense;
