/**
 * OCRUpload — lets the user scan a receipt image and auto-fill the expense form.
 * Calls POST /ocr and passes the extracted data up via onExtracted().
 */

import { useRef, useState } from 'react';
import { scanReceipt } from '../api/expensesApi';

const OCRUpload = ({ onExtracted, onFileSelected }) => {
    const inputRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [ocrError, setOcrError] = useState('');
    const [scanned, setScanned] = useState(false);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Only images for OCR (PDF not supported by pytesseract directly)
        const isImage = ['image/jpeg', 'image/png'].includes(file.type);

        // Always pass the file up so it can be used as the receipt attachment
        if (onFileSelected) onFileSelected(file);

        if (!isImage) {
            setOcrError('OCR only works with JPG/PNG images. File attached but not scanned.');
            return;
        }

        setOcrError('');
        setScanned(false);
        setScanning(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await scanReceipt(formData);
            onExtracted(data);
            setScanned(true);
        } catch (err) {
            const msg = err.response?.data?.detail || 'OCR scan failed. You can fill the form manually.';
            setOcrError(msg);
        } finally {
            setScanning(false);
            // Reset input so the same file can be re-selected if needed
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <div className="rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 p-4 mb-5">
            <div className="flex items-center gap-3">
                {/* Camera icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-800">Scan Receipt with OCR</p>
                    <p className="text-xs text-indigo-500">Upload a JPG/PNG to auto-fill the form below</p>
                </div>

                <label className={`cursor-pointer flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition
                    ${scanning
                        ? 'bg-indigo-300 text-white cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                    {scanning ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Scanning...
                        </span>
                    ) : 'Upload & Scan'}
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        disabled={scanning}
                        onChange={handleFile}
                    />
                </label>
            </div>

            {/* Status messages */}
            {scanning && (
                <p className="mt-3 text-xs text-indigo-600 flex items-center gap-1">
                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Scanning receipt... please wait
                </p>
            )}
            {scanned && !ocrError && (
                <p className="mt-3 text-xs text-green-700 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Receipt scanned — form pre-filled. Review and adjust if needed.
                </p>
            )}
            {ocrError && (
                <p className="mt-3 text-xs text-amber-700 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {ocrError}
                </p>
            )}
        </div>
    );
};

export default OCRUpload;
