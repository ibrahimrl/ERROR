const vscode = require('vscode');

function showSettingsWebview(context) {
    const panel = vscode.window.createWebviewPanel(
        'errorSettings',
        'Extension Settings',
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    panel.webview.html = getWebviewContent(context);

    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'saveSettings':
                    saveSettings(context, message.settings);
                    vscode.window.showInformationMessage('Settings saved successfully.');
                    break;
                case 'addApiLink':
                    addApiLink(context, message.apiLink);
                    break;
                case 'saveApiLink':
                    saveApiLink(context, message.apiLink);
                    break;
            }
        },
        undefined,
        context.subscriptions
    );

    panel.onDidChangeViewState(
        () => {
            panel.webview.html = getWebviewContent();
        },
        null,
        context.subscriptions
    );
}

function getWebviewContent() {
    const config = vscode.workspace.getConfiguration('errorExtension');
    const apiLinks = config.get('apiLinks', []); // Ensure this is in your configuration defaults
    const currentApiLink = config.get('apiLink', '');
    const apiToken = config.get('apiToken', '');
    const modelName = config.get('modelName', '');
    const rateModelPerformance = config.get('rateModelPerformance', '');
    
    let apiLinksOptions = apiLinks.map(link => `<option value="${link}" ${link === currentApiLink ? 'selected' : ''}>${link}</option>`).join('');
    apiLinksOptions += '<option value="add_new_link">+ Add new link</option>'; // Option to add new link


    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ERROR Extension Settings</title>
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
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                    color: #000;
                }
                .content {
                    font-size: 18px;
                    line-height: 1.7;
                    color: #555;
                }
                .form-group {
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                }
                .form-group label {
                    flex: 0 0 150px;
                    font-weight: bold;
                    color: #000;
                }
                .form-group input,
                .form-group select {
                    flex: 1;
                    padding: 10px;
                    font-size: 16px;
                    border: none;
                    border-bottom: 2px solid #000;
                    outline: none;
                }
                
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="header">ERROR Extension Settings</h1>
                <p style="color: black;"><strong>Warning:</strong> Not all models, whether from Hugging Face or local sources, are designed for code explanations or completions. The quality of explanations and completed code may vary significantly or yield unexpected results for this reason.</p>
                <div class="content">
                    <div class="form-group">
                        <label for="apiLinkDropdown">API Link:</label>
                        <select id="apiLinkDropdown" onchange="handleApiLinkChange()" >
                            ${apiLinksOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="apiToken">API Token:</label>
                        <input type="text" id="apiToken" name="apiToken" value="${apiToken}" oninput="debouncedSaveSettings()" />
                    </div>
                    <div class="form-group">
                        <label for="modelName">Local Model Name:</label>
                        <input type="text" id="modelName" name="modelName" value="${modelName}" oninput="debouncedSaveSettings()" />
                    </div>
                    <div class="form-group">
                        <label for="rateModelPerformance">Model Rating</label>
                        <label class="switch"">
                            <input type="checkbox" id="rateModelPerformance" name="rateModelPerformance" ${rateModelPerformance ? 'checked' : ''} oninput="debouncedSaveSettings()" />
                            <span class="slider"></span>

                        </label>
                    </div>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();

                window.addEventListener('DOMContentLoaded', () => {
                    const selectElement = document.getElementById('apiLinkDropdown');
                    selectElement.addEventListener('change', handleApiLinkChange);
                });

                function handleApiLinkChange() {
                    const select = document.getElementById('apiLinkDropdown');
                    const selectedValue = select.value;

                    console.log("Selected value:", selectedValue);

                    if (selectedValue === 'add_new_link') {
                        let newLink = prompt('Enter new API Link:');
                        if (newLink && newLink.trim() !== "") {
                            const newOption = document.createElement('option');
                            newOption.text = newOption.value = newLink;
                            select.add(newOption, select.options[select.options.length - 1]);
                            select.value = newLink;
                            vscode.postMessage({ command: 'addApiLink', apiLink: newLink });
                        } else {
                            select.value = select.options[0].value; // Revert if cancelled
                        }
                    } else {
                        vscode.postMessage({ command: 'saveApiLink', apiLink: selectedValue });
                    }
                }

                window.addEventListener('DOMContentLoaded', (event) => {
                    document.getElementById('apiLinkDropdown').addEventListener('change', function(event) {
                        handleApiLinkChange();
                    });
                });

                let debounceTimeout;
                function debouncedSaveSettings() {
                    clearTimeout(debounceTimeout);
                    debounceTimeout = setTimeout(saveSettings, 1000);
                }
                function saveSettings() {
                    const apiToken = document.getElementById('apiToken').value;
                    const modelName = document.getElementById('modelName').value;
                    const rateModelPerformance = document.getElementById('rateModelPerformance').checked;
                    vscode.postMessage({
                        command: 'saveSettings',
                        settings: {
                            apiLink: document.getElementById('apiLinkDropdown').value,
                            apiToken,
                            modelName,
                            rateModelPerformance
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
    config.update('modelName', settings.modelName, vscode.ConfigurationTarget.Global);
    config.update('rateModelPerformance', settings.rateModelPerformance, vscode.ConfigurationTarget.Global);
}

function addApiLink(context, newLink) {
    const config = vscode.workspace.getConfiguration('errorExtension');
    let apiLinks = config.get('apiLinks', []);
    if (!apiLinks.includes(newLink)) {
        apiLinks.push(newLink);
        config.update('apiLinks', apiLinks, vscode.ConfigurationTarget.Global);
        config.update('apiLink', newLink, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('New API link added successfully.');
    }
}

function saveApiLink(context, apiLink) {
    const config = vscode.workspace.getConfiguration('errorExtension');
    config.update('apiLink', apiLink, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage('API link updated successfully.');
}


function getModelName() {
    return vscode.workspace.getConfiguration('errorExtension').get('modelName');
}

module.exports = {
    showSettingsWebview,
    getModelName
};
