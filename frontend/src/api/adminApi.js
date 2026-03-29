import api from './axios';

export const getDashboardStats = () => api.get('/admin/dashboard');
export const getUsers = () => api.get('/admin/users');
export const getApprovalConfig = () => api.get('/admin/approval-config');
export const updateApprovalConfig = (data) => api.put('/admin/approval-config', data);
export const createRule = (data) => api.post('/admin/rules', data);
export const getRules = () => api.get('/admin/rules');
export const updateRule = (ruleId, data) => api.put(`/admin/rules/${ruleId}`, data);
export const deleteRule = (ruleId) => api.delete(`/admin/rules/${ruleId}`);
export const addApprovers = (ruleId, approvers) =>
    api.post(`/admin/rules/${ruleId}/approvers`, { approvers });
