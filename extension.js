const vscode = require('vscode');
const { getHoverProvider } = require('./hoverProvider');
const { registerCommands } = require('./commands');
const { showSettingsWebview } = require('./settings');

let useLocalModel = false; // Global variable to keep track of the mode

function activate(context) {
    console.log('Extension "ERROR" is now active!');

    const hoverProviderPython = vscode.languages.registerHoverProvider('python', {
        provideHover: getHoverProvider('Python')
    });

    const hoverProviderJavaScript = vscode.languages.registerHoverProvider('javascript', {
        provideHover: getHoverProvider('JavaScript')
    });

    registerCommands(context, () => useLocalModel);

    let myButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    myButton.text = `Use ${useLocalModel ? "API" : "Local Model"}`;
    myButton.tooltip = "Click to toggle between API and local model";
    myButton.command = 'error-extension.toggleModel';
    myButton.show();

    let toggleCommand = vscode.commands.registerCommand('error-extension.toggleModel', () => {
        useLocalModel = !useLocalModel;
        vscode.window.showInformationMessage(`Switched to ${useLocalModel ? "Local Model" : "API"} Mode`);
        myButton.text = `Use ${useLocalModel ? "API" : "Local Model"}`;
    });

    let settingsButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    settingsButton.text = `$(gear)`;
    settingsButton.tooltip = "Click to configure extension settings";
    settingsButton.command = 'error-extension.openSettings';
    settingsButton.show();

    let openSettingsCommand = vscode.commands.registerCommand('error-extension.openSettings', () => {
        showSettingsWebview(context);
    });

    context.subscriptions.push(hoverProviderPython, hoverProviderJavaScript, myButton, toggleCommand, settingsButton, openSettingsCommand);
}

function deactivate() {
    console.log('Extension "ERROR" has been deactivated');
}

module.exports = {
    activate,
    deactivate
};
