const vscode = require('vscode');
const { getHoverProvider } = require('./hoverProvider');

// Global variable to keep track of the mode
let useLocalModel = false;

function activate(context) {
    console.log('Extension "ERROR" is now active!');

    // Register hover provider for both Python and JavaScript
    const hoverProviderPython = vscode.languages.registerHoverProvider('python', {
        provideHover: getHoverProvider('Python')
    });

    const hoverProviderJavaScript = vscode.languages.registerHoverProvider('javascript', {
        provideHover: getHoverProvider('JavaScript')
    });

    let myButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    myButton.text = `Use ${useLocalModel ? "API" : "Local Model"}`;
    myButton.tooltip = "Click to toggle between API and local model";
    myButton.command = 'error-extension.toggleModel';
    myButton.show();

    // Register toggle command
    let toggleCommand = vscode.commands.registerCommand('error-extension.toggleModel', () => {
        useLocalModel = !useLocalModel;
        vscode.window.showInformationMessage(`Switched to ${useLocalModel ? "Local Model" : "API"} Mode`);
        myButton.text = `Use ${useLocalModel ? "API" : "Local Model"}`;
    });

    // Store providers to deactivate
    context.subscriptions.push(hoverProviderPython, hoverProviderJavaScript, myButton, toggleCommand);
}

function deactivate() {
    console.log('Extension "ERROR" has been deactivated');
}

module.exports = {
    activate,
    deactivate
};
