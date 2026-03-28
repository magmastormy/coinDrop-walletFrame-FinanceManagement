function sanitizeHtml(input = '') {
    return String(input)
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
        .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
        .replace(/<embed[\s\S]*?>[\s\S]*?<\/embed>/gi, '')
        .replace(/<link[\s\S]*?>[\s\S]*?<\/link>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/data:/gi, '');
}

function sanitizeInput(input) {
    if (input === null || input === undefined) {
        return input;
    }
    
    if (typeof input === 'string') {
        return sanitizeHtml(input)
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .trim();
    }
    
    if (Array.isArray(input)) {
        return input.map(item => sanitizeInput(item));
    }
    
    if (typeof input === 'object') {
        const sanitized = {};
        for (const key in input) {
            if (Object.prototype.hasOwnProperty.call(input, key)) {
                sanitized[key] = sanitizeInput(input[key]);
            }
        }
        return sanitized;
    }
    
    return input;
}

module.exports = {
    sanitizeHtml,
    sanitizeInput
};
