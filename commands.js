const vscode = require('vscode');
const ollama = require('ollama').default || require('ollama');
const { queryHuggingFaceAPI, adjustTextLength, processApiResponseForCompleteCode, processApiResponseForExplainCode } = require('./api');
const { showWebview, getFunctionText } = require('./utils');
const { getModelName } = require('./settings');

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
                    const explanationText = `# Explain what the code does step by step and provide the user with detailed suggestions on how to improve the code, focusing on best practices, efficiency, readability, and potential edge cases. Be as thorough as possible in your explanation.\nEXPLANATION = """\n`;
                    if (useLocalModel) {
                        const explanation = await explainCodeWithOllama(functionText);
                        showWebview(editor, result.functionName, explanation, context);
                        vscode.window.showInformationMessage('Explain Code: See results in the new panel.');
                    } else {
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
                const completionText = `# Continue the implementation of the following function. Use the function name, any provided code, and comments to guide your implementation. If the purpose is unclear, make logical assumptions to complete the function in a meaningful way. Handle edge cases and follow best practices.\n`;
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
                        const explanation = await explainCodeWithOllama(newText);
                        if (explanation) {
                            // const completedCode = processApiResponseForCompleteCode(explanation);
                            vscode.window.showInformationMessage('Complete Code: See results in the current file.');
                            const endLine = args.range.start.line + functionText.split('\n').length;
                            const insertPosition = new vscode.Position(endLine, 0); // Adjust as necessary to place correctly

                            const FinalForm = `\n${comment}Completed code\n${explanation}\n`;

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

    async function explainCodeWithOllama(codeDescription) {
        const modelName = getModelName();
        try {
            
          const response = await ollama.chat({
            model: modelName,
            messages: [{
              role: 'user',
              content: `${codeDescription}`
            }]
          });
      
          const cleanedResponse = response.message.content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
      
          return cleanedResponse;
      
        } catch (error) {
          console.error('Error explaining code:', error);
          return 'An error occurred while generating the explanation.';
        }
      }

    context.subscriptions.push(explainCodeCommand, completeCodeCommand, inputTextCommand);
}

module.exports = {
    registerCommands
};
