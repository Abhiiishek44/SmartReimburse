import api from './axios';

export const getMyCompany = () => api.get('/company/me');
export const updateCompany = (data) => api.put('/company/update', data);
export const getCurrencyRates = () => api.get('/company/currency-rates');
export const getCountries = () => api.get('/company/countries');
