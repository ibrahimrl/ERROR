const vscode = require('vscode');
const { queryHuggingFaceAPI, adjustTextLength, processApiResponseForExplainCode } = require('./api');
const { showWebview, getFunctionText } = require('./utils');

function registerCommands(context) {
    let explainCodeCommand = vscode.commands.registerCommand('ERROR.explainCode', async (args) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document) {
            const document = editor.document;
            const result = await getFunctionText(document, args);
            const functionText = result.text;
            if (functionText) {
                try {
                    const explanationText = `# Explain what the code does and give the user 1 suggestion on how to improve the code:\nEXPLANATION = """\n`;
                    const finalForm = `${functionText}\n${explanationText}`;
                    const apiResult = await queryHuggingFaceAPI({inputs: finalForm});
                    const processedCode = adjustTextLength(processApiResponseForExplainCode(apiResult, finalForm), 100, 150);
                    showWebview(editor, result.functionName, processedCode);
                    vscode.window.showInformationMessage('Explain Code: See results in the new panel.');
                } catch (error) {
                    vscode.window.showErrorMessage('Failed to explain code: ' + error.message);
                }
            } else {
                console.error('Failed to extract function code');
                vscode.window.showErrorMessage('Failed to execute Explain Code: Unable to extract function code.');
            }
        }
    });

    context.subscriptions.push(explainCodeCommand);
}

module.exports = {
    registerCommands
};
