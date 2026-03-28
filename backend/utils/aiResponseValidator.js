const z = require('zod');

// Schema definitions for AI responses
const ResponseSchemas = {
    // Chatbot response schema
    chatResponse: z.object({
        response: z.string().min(1).max(2000),
        context: z.object({
            userId: z.string(),
            timestamp: z.number()
        }).optional(),
        metadata: z.object({
            confidence: z.number().min(0).max(1).optional(),
            sources: z.array(z.string()).optional()
        }).optional()
    }),

    // Category suggestion schema
    categorySuggestion: z.object({
        category: z.string(),
        confidence: z.number().min(0).max(1),
        reasoning: z.string().optional()
    }),

    // Financial insight schema
    financialInsight: z.object({
        type: z.enum(['spending', 'savings', 'budget', 'general']),
        message: z.string().min(1).max(500),
        priority: z.enum(['low', 'medium', 'high']),
        actionable: z.boolean().optional(),
        data: z.object({}).optional()
    })
};

// Prompt injection detection patterns
const INJECTION_PATTERNS = [
    /ignore\s+(previous|above|instructions)/i,
    /system\s+prompt/i,
    /developer\s+instruction/i,
    /bypass\s+(rules|restrictions|filters)/i,
    /act\s+as\s+(admin|developer|system)/i,
    /output\s+(your|the)\s+(prompt|instructions|configuration)/i,
    /\[SYSTEM\]/i,
    /<system>/i,
    /BEGIN\s+DIALOGUE/i,
    /forget\s+(all|previous)/i,
    /new\s+instructions/i,
    /override\s+(previous|all)/i
];

// Content safety patterns
const UNSAFE_CONTENT_PATTERNS = [
    // Hate speech indicators (basic)
    /\b(hate|racist|discriminate|superiority)\b/i,
    // Violence threats
    /\b(kill|murder|attack|threaten|harm)\b/i,
    // Self-harm
    /\b(suicide|self[- ]?harm|cutting|overdose)\b/i,
    // Explicit content
    /\b(explicit|pornograph|xxx|nsfw)\b/i
];

class AIResponseValidator {
    /**
     * Validate AI response against schema
     */
    static validateResponse(response, schemaName = 'chatResponse') {
        try {
            const schema = ResponseSchemas[schemaName];
            if (!schema) {
                throw new Error(`Unknown schema: ${schemaName}`);
            }

            const validated = schema.parse(response);
            return {
                valid: true,
                data: validated
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    valid: false,
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                        code: 'validation_error'
                    }))
                };
            }
            throw error;
        }
    }

    /**
     * Detect prompt injection attempts
     */
    static detectPromptInjection(input) {
        const detectedPatterns = [];

        INJECTION_PATTERNS.forEach((pattern, index) => {
            if (pattern.test(input)) {
                detectedPatterns.push({
                    pattern: pattern.toString(),
                    severity: 'high',
                    description: 'Potential prompt injection attempt detected'
                });
            }
        });

        return {
            isInjection: detectedPatterns.length > 0,
            patterns: detectedPatterns,
            riskLevel: detectedPatterns.length > 2 ? 'critical' : 
                      detectedPatterns.length > 0 ? 'high' : 'low'
        };
    }

    /**
     * Check content safety
     */
    static checkContentSafety(content) {
        const violations = [];

        UNSAFE_CONTENT_PATTERNS.forEach((pattern, index) => {
            if (pattern.test(content)) {
                violations.push({
                    type: 'unsafe_content',
                    pattern: pattern.toString(),
                    severity: 'medium'
                });
            }
        });

        return {
            isSafe: violations.length === 0,
            violations: violations,
            riskLevel: violations.length > 2 ? 'high' : 
                      violations.length > 0 ? 'medium' : 'low'
        };
    }

    /**
     * Comprehensive validation with all checks
     */
    static async validateAIResponse(response, options = {}) {
        const {
            checkInjection = true,
            checkSafety = true,
            validateSchema = true,
            schemaName = 'chatResponse'
        } = options;

        const results = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check for prompt injection
        if (checkInjection && response.input) {
            const injectionCheck = this.detectPromptInjection(response.input);
            if (injectionCheck.isInjection) {
                results.valid = false;
                results.errors.push({
                    type: 'prompt_injection',
                    severity: 'critical',
                    details: injectionCheck.patterns,
                    error_code: 'PROMPT_INJECTION_DETECTED'
                });
            }
        }

        // Check content safety
        if (checkSafety && response.response) {
            const safetyCheck = this.checkContentSafety(response.response);
            if (!safetyCheck.isSafe) {
                results.warnings.push({
                    type: 'unsafe_content',
                    severity: safetyCheck.riskLevel,
                    details: safetyCheck.violations,
                    error_code: 'UNSAFE_CONTENT_DETECTED'
                });
            }
        }

        // Validate schema
        if (validateSchema) {
            const schemaValidation = this.validateResponse(response, schemaName);
            if (!schemaValidation.valid) {
                results.valid = false;
                results.errors.push(...schemaValidation.errors);
            } else {
                results.data = schemaValidation.data;
            }
        }

        return results;
    }

    /**
     * Sanitize user input before sending to AI
     */
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        let sanitized = input;

        // Remove potential injection markers
        INJECTION_PATTERNS.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });

        // Limit length
        const maxLength = 2000;
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized;
    }
}

module.exports = AIResponseValidator;
