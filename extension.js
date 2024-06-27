const vscode = require('vscode');
const { getHoverProvider } = require('./hoverProvider');

function activate(context) {
    console.log('Extension "ERROR" is now active!');

    // Register hover provider for both Python and JavaScript
    const hoverProviderPython = vscode.languages.registerHoverProvider('python', {
        provideHover: getHoverProvider('Python')
    });

    const hoverProviderJavaScript = vscode.languages.registerHoverProvider('javascript', {
        provideHover: getHoverProvider('JavaScript')
    });

    // Store providers to deactivate
    context.subscriptions.push(hoverProviderPython, hoverProviderJavaScript);
}

function deactivate() {
    console.log('Extension "ERROR" has been deactivated');
}

module.exports = {
    activate,
    deactivate
};
