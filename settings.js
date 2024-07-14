const vscode = require('vscode');

function showSettingsWebview(context) {
    const panel = vscode.window.createWebviewPanel(
        'errorSettings', // Identifies the type of the webview. Used internally
        'Extension Settings', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in
        {
            enableScripts: true
        }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'saveSettings':
                    saveSettings(context, message.settings);
                    vscode.window.showInformationMessage('Settings saved successfully.');
                    return;
            }
        },
        undefined,
        context.subscriptions
    );
}

function getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Extension Settings</title>
            <style>
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f0f2f5;
                    color: #333;
                }
                .container {
                    max-width: 800px;
                    margin: 30px auto;
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                .header {
                    font-size: 28px;
                    font-weight: 600;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 10px;
                    color: #007bff;
                }
                .content {
                    font-size: 18px;
                    line-height: 1.7;
                    color: #555;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                }
                .form-group input {
                    width: 100%;
                    padding: 10px;
                    font-size: 16px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                }
                .form-group button {
                    background-color: #007bff;
                    color: #fff;
                    padding: 10px 20px;
                    font-size: 16px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="header">Extension Settings</h1>
                <div class="content">
                    <div class="form-group">
                        <label for="apiLink">API Link:</label>
                        <input type="text" id="apiLink" name="apiLink" value="" />
                    </div>
                    <div class="form-group">
                        <label for="apiToken">API Token:</label>
                        <input type="text" id="apiToken" name="apiToken" value="" />
                    </div>
                    <div class="form-group">
                        <button onclick="saveSettings()">Save Settings</button>
                    </div>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                function saveSettings() {
                    const apiLink = document.getElementById('apiLink').value;
                    const apiToken = document.getElementById('apiToken').value;
                    vscode.postMessage({
                        command: 'saveSettings',
                        settings: {
                            apiLink,
                            apiToken
                        }
                    });
                }
            </script>
        </body>
        </html>
    `;
}

function saveSettings(context, settings) {
    const config = vscode.workspace.getConfiguration('errorExtension');
    config.update('apiLink', settings.apiLink, vscode.ConfigurationTarget.Global);
    config.update('apiToken', settings.apiToken, vscode.ConfigurationTarget.Global);
}

module.exports = {
    showSettingsWebview
};
