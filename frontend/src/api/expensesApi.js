import api from './axios';

export const createExpense = (data) => api.post('/expenses', data);
export const getMyExpenses = () => api.get('/expenses/my');
export const getTeamExpenses = () => api.get('/expenses/team');
export const getAllExpenses = () => api.get('/expenses/all');
export const submitExpense = (expenseId) => api.post(`/expenses/${expenseId}/submit`);
export const getPendingApprovals = () => api.get('/approvals/pending');
export const approveExpense = (expenseId, comment) => api.post(`/approvals/${expenseId}/approve`, { comment });
export const rejectExpense = (expenseId, comment) => api.post(`/approvals/${expenseId}/reject`, { comment });
