// This file contains utility functions that can be reused across the application.

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const generateUniqueId = () => {
    return 'id-' + Math.random().toString(36).substr(2, 16);
};

const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

module.exports = {
    formatCurrency,
    generateUniqueId,
    isValidEmail,
};