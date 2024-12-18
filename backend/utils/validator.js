//utils.validator.js
const validator = require('validator');

class ValidationUtils {
    // Validate email
    static isValidEmail(email) {
        return validator.isEmail(email);
    }

    // Validate strong password
    static isStrongPassword(password) {
        return validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        });
    }

    // Sanitize input
    static sanitizeInput(input) {
        return validator.escape(input.trim());
    }

    // Validate currency
    static isValidCurrency(currency) {
        return /^[A-Z]{3}$/.test(currency);
    }

    // Validate amount
    static isValidAmount(amount) {
        return validator.isFloat(amount.toString(), { min: 0 });
    }

    // Validate date
    static isValidDate(date) {
        return validator.isDate(date);
    }

    // Validate phone number
    static isValidPhoneNumber(phone) {
        return validator.isMobilePhone(phone, 'any');
    }

    // Validate URL
    static isValidURL(url) {
        return validator.isURL(url);
    }

    // Validate JSON
    static isValidJSON(json) {
        try {
            JSON.parse(json);
            return true;
        } catch (e) {
            return false;
        }
    }
}

module.exports = ValidationUtils;