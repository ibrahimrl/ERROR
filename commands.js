const vscode = require('vscode');
const { queryHuggingFaceAPI, adjustTextLength, processApiResponseForCompleteCode, processApiResponseForExplainCode } = require('./api');
const { showWebview, getFunctionText } = require('./utils');

function registerCommands(context, getUseLocalModel) {
    let explainCodeCommand = vscode.commands.registerCommand('ERROR.explainCode', async (args) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document) {
            const document = editor.document;
            const result = await getFunctionText(document, args);
            const functionText = result.text;
            if (functionText) {
                try {
                    const useLocalModel = getUseLocalModel();
                    if (useLocalModel) {
                        vscode.window.showInformationMessage('Local Model mode is enabled. Implement the local model logic here.');
                        // Placeholder for local model logic
                        // const explanationText = localModelExplainCode(functionText);
                        // showWebview(editor, result.functionName, explanationText);
                    } else {
                        const explanationText = `# Explain what the code does and give the user 1 suggestion on how to improve the code:\nEXPLANATION = """\n`;
                        const finalForm = `${functionText}\n${explanationText}`;
                        const apiResult = await queryHuggingFaceAPI({inputs: finalForm});
                        const processedCode = adjustTextLength(processApiResponseForExplainCode(apiResult, finalForm), 100, 150);
                        showWebview(editor, result.functionName, processedCode);
                        vscode.window.showInformationMessage('Explain Code: See results in the new panel.');
                    }
                } catch (error) {
                    vscode.window.showErrorMessage('Failed to explain code: ' + error.message);
                }
            } else {
                console.error('Failed to extract function code');
                vscode.window.showErrorMessage('Failed to execute Explain Code: Unable to extract function code.');
            }
        }
    });

    let completeCodeCommand = vscode.commands.registerCommand('ERROR.completeCode', async (args) => {
        const editor = vscode.window.activeTextEditor;
        if (editor && args && args.range && typeof args.range.start === 'object' && editor.document) {
            const document = editor.document;
            const result = await getFunctionText(document, args);
            const functionText = result.text;
            if (functionText) {
                // Prepare the completion text
                const completionText = `\n# Complete the code:\n`;
                const newText = `${functionText}${completionText}`;

                const language = document.languageId;
                let comment;

                if (language == 'python') {
                    comment = '#'; 
                } else if (language == 'javascript') {
                    comment = '//';
                }

                try {
                    const useLocalModel = getUseLocalModel();
                    if (useLocalModel) {
                        vscode.window.showInformationMessage('Local Model mode is enabled. Implement the local model logic here.');
                        // Placeholder for local model logic
                        // const completedCode = localModelCompleteCode(functionText);
                        // editor.edit(editBuilder => {
                        //     editBuilder.insert(insertPosition, completedCode);
                        // });
                    } else {
                        const apiResult = await queryHuggingFaceAPI({inputs: newText});
                        if (apiResult) {
                            const completedCode = processApiResponseForCompleteCode(apiResult);
                            vscode.window.showInformationMessage('Complete Code: See results in the current file.');
                            const endLine = args.range.start.line + functionText.split('\n').length;
                            const insertPosition = new vscode.Position(endLine, 0); // Adjust as necessary to place correctly

                            const FinalForm = `\n${comment}Completed code\n${completedCode}\n`;

                            editor.edit(editBuilder => {
                                editBuilder.insert(insertPosition, FinalForm);
                            }).then(success => {
                                if (success) {
                                    vscode.window.showInformationMessage('Completion prompt added to the function.');
                                } else {
                                    vscode.window.showErrorMessage('Failed to insert completion prompt.');
                                }
                            });
                        } else {
                            vscode.window.showErrorMessage('No result from API');
                        }
                    }
                } catch (error) {
                    vscode.window.showErrorMessage('Failed to complete code: ' + error.message);
                }
            } else {
                console.error('Failed to extract function code');
                vscode.window.showErrorMessage('Failed to execute Complete Code: Unable to extract function code.');
            }
        }
    });

    let inputTextCommand = vscode.commands.registerCommand('error-extension.inputTextCommand', async () => {
        const input = await vscode.window.showInputBox({
            placeHolder: 'Enter your text here',
            prompt: 'Type something and press Enter'
        });

        if (input) {
            vscode.window.showInformationMessage(`You entered: ${input}`);
        }

        if (input) {
            console.log('User Input:', input);
            vscode.window.showInformationMessage(`You entered: ${input}`);
        } else {
            console.log('No input received');
            vscode.window.showInformationMessage('No input provided');
        }

    });

    context.subscriptions.push(explainCodeCommand, completeCodeCommand, inputTextCommand);
}

module.exports = {
    registerCommands
};
