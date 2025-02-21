const { spawn } = require('child_process');
const path = require('path');

class AIAdvisorService {
    async getFinancialAdvice(userData) {
        console.log('Getting financial advice for user data:', JSON.stringify(userData, null, 2));
        
        const message = {
            role: 'user',
            content: this._formatUserContext(userData)
        };
        
        console.log('Formatted AI message:', JSON.stringify([message], null, 2));
        return this._callZhipuAI([message]);
    }

    _formatUserContext(userData) {
        const { income, transactions, budgetStatus } = userData;
        
        // Format transactions into readable text
        const transactionText = transactions.map(t => 
            `- ${t.category}: ${t.amount} (${new Date(t.date).toLocaleDateString()})`
        ).join('\n');

        // Format budget status into readable text
        const budgetText = Object.entries(budgetStatus)
            .map(([category, { spent, limit }]) => 
                `- ${category}: Spent ${spent} of ${limit}`
            ).join('\n');

        return `As a financial advisor, analyze this user's financial data and provide specific advice:

Monthly Income: ${income}

Recent Transactions:
${transactionText}

Budget Status:
${budgetText}

Please provide:
1. Analysis of spending patterns
2. Specific areas of concern
3. Actionable recommendations for improvement`;
    }

    async _callZhipuAI(messages) {
        console.log('Calling ZhipuAI with Python script');
        
        const pythonScript = path.join(__dirname, '../../volcanicEngine/glm_api.py');
        console.log('Python script path:', pythonScript);
        
        const pythonProcess = spawn('python', [
            pythonScript,
            JSON.stringify(messages)
        ]);

        return new Promise((resolve, reject) => {
            let output = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            pythonProcess.on('close', (code) => {
                console.log('Python process closed with code:', code);
                console.log('Complete stdout:', output);
                console.log('Complete stderr:', errorOutput);

                if (code !== 0) {
                    reject(new Error(errorOutput || `Process exited with code ${code}`));
                    return;
                }

                try {
                    const jsonResponse = JSON.parse(output.trim());
                    if (jsonResponse.error) {
                        reject(new Error(jsonResponse.error));
                        return;
                    }
                    resolve(jsonResponse.response);
                } catch (error) {
                    reject(new Error('Failed to parse AI response'));
                }
            });

            pythonProcess.on('error', (error) => {
                console.error('Failed to start Python process:', error);
                reject(new Error('Failed to start AI process'));
            });
        });
    }
}

module.exports = new AIAdvisorService();
