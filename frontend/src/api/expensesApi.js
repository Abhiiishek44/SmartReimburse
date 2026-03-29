import api from './axios';

// OCR: scan a receipt image and extract expense fields
export const scanReceipt = (formData) =>
    api.post('/ocr', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const createExpense = (data) => {
	const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
	return api.post('/expenses', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
};
export const getMyExpenses = () => api.get('/expenses/my');
export const getTeamExpenses = () => api.get('/expenses/team');
export const getAllExpenses = () => api.get('/expenses/all');
export const submitExpense = (expenseId) => api.post(`/expenses/${expenseId}/submit`);
export const getPendingApprovals = () => api.get('/approvals/pending');
export const approveExpense = (expenseId, comment) => api.post(`/approvals/${expenseId}/approve`, { comment });
export const rejectExpense = (expenseId, comment) => api.post(`/approvals/${expenseId}/reject`, { comment });

export const getManagerPendingApprovals = () => api.get('/manager/approvals/pending');
export const approveManagerExpense = (expenseId) => api.post(`/manager/approvals/${expenseId}/approve`);
export const rejectManagerExpense = (expenseId) => api.post(`/manager/approvals/${expenseId}/reject`);
