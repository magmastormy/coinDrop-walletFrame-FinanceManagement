const moment = require('moment-timezone');

class DateUtils {
    // Get current timestamp
    static getCurrentTimestamp() {
        return moment().toISOString();
    }

    // Format date
    static formatDate(date, format = 'YYYY-MM-DD') {
        return moment(date).format(format);
    }

    // Convert to specific timezone
    static convertToTimezone(date, timezone = 'UTC') {
        return moment(date).tz(timezone).format();
    }

    // Calculate duration between two dates
    static getDuration(startDate, endDate, unit = 'days') {
        return moment(endDate).diff(moment(startDate), unit);
    }

    // Check if date is within a range
    static isDateInRange(date, startDate, endDate) {
        return moment(date).isBetween(startDate, endDate, null, '[]');
    }

    // Get start and end of various time periods
    static getStartOfDay(date = new Date()) {
        return moment(date).startOf('day').toDate();
    }

    static getEndOfDay(date = new Date()) {
        return moment(date).endOf('day').toDate();
    }

    static getStartOfMonth(date = new Date()) {
        return moment(date).startOf('month').toDate();
    }

    static getEndOfMonth(date = new Date()) {
        return moment(date).endOf('month').toDate();
    }

    // Generate date range
    static generateDateRange(startDate, endDate, interval = 'days') {
        const dates = [];
        let current = moment(startDate);
        const end = moment(endDate);

        while (current.isSameOrBefore(end)) {
            dates.push(current.format('YYYY-MM-DD'));
            current.add(1, interval);
        }

        return dates;
    }

    // Parse and validate date
    static parseDate(dateString, format = 'YYYY-MM-DD') {
        const parsedDate = moment(dateString, format, true);
        return parsedDate.isValid() ? parsedDate.toDate() : null;
    }
}

module.exports = DateUtils;
