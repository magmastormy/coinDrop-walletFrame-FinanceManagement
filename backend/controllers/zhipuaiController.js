const { spawn } = require('child_process');
const path = require('path');

exports.sendMessage = async (req, res, next) => {
    try {
        const { messages } = req.body;
        const model = 'glm-4-0520';
        const messagesJson = JSON.stringify(messages);

        const pythonScriptPath = path.join(__dirname, '../../volcanicEngine/glm_api.py');
        const pythonProcess = spawn('python', [pythonScriptPath, model, messagesJson]);

        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python script error: ${data.toString()}`);
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                const responseData = JSON.parse(output);
                res.json(responseData);
            } else {
                next(new Error(`Python script exited with code ${code}`));
            }
        });
    } catch (error) {
        next(error);
    }
};