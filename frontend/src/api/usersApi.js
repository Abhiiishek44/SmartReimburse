import api from './axios';

export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUserRole = (userId, data) => api.put(`/users/${userId}`, data);
export const assignManager = (userId, manager_id) => api.put(`/users/${userId}/assign-manager`, { manager_id });
