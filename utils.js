const vscode = require('vscode');

function showWebview(editor, title, content) {
    const panel = vscode.window.createWebviewPanel(
        'explainCode', // Identifies the type of the webview. Used internally
        title, // Title of the panel displayed to the user
        vscode.ViewColumn.Beside, // Shows the webview to the side of the editor
        {} // Webview options. More details can be added here.
    );
    panel.webview.html = getWebviewContent(content, title);
}

function getWebviewContent(content, functionName) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Explanation</title>
            <style>
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f0f2f5;
                    color: #333;
                }
                .navbar {
                    background-color: #343a40;
                    padding: 15px 20px;
                    color: #f8f9fa;
                    font-size: 20px;
                    font-weight: bold;
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
            </style>
        </head>
        <body>
            <div class="navbar">Code Explanation</div>
            <div class="container">
                <h1>${functionName} Explanation</h1>
                <div class="content">
                    <p>${content}</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

async function getFunctionText(document, args) {
    if (!document || !args || !args.range || typeof args.range.start !== 'object') {
        return null;  // Return null if required arguments are missing
    }

    const languageId = document.languageId;
    const start = new vscode.Position(args.range.start.line, 0);
    let endLine = args.range.start.line;

    let functionRegex;

    if (languageId === 'python') {
        functionRegex = /^\s*def\s+(\w+)\s*\([^)]*\)\s*->\s*[^:]*:|^\s*def\s+(\w+)\s*\([^)]*\)\s*:|^\s*class\s+\w+[^:]*:\s*\n(?:\s+.*)*^\s*def\s+(\w+)\s*\([^)]*\)\s*->\s*[^:]*:|^\s*class\s+\w+[^:]*:\s*\n(?:\s+.*)*^\s*def\s+(\w+)\s*\([^)]*\)\s*:/gm;;
        const startIndentation = document.lineAt(start.line).firstNonWhitespaceCharacterIndex;
        while (endLine + 1 < document.lineCount) {
            const lineIndentation = document.lineAt(endLine + 1).firstNonWhitespaceCharacterIndex;
            if (lineIndentation <= startIndentation && document.lineAt(endLine + 1).text.trim() !== '') break;
            endLine++;
        }
    } else if (languageId === 'javascript') {
        functionRegex = /function\s+(\w+)\s*\(.*?\)|[const|let|var]\s+(\w+)\s*=\s*\(.*?\)\s*=>|[const|let|var]\s+(\w+)\s*=.*?function(?:\s+\w+)?\s*\(.*?\)/;
        
        
        let openBraces = 0;
        do {
            const lineText = document.lineAt(endLine).text;
            openBraces += (lineText.match(/{/g) || []).length;
            openBraces -= (lineText.match(/}/g) || []).length;
            endLine++;
        } while (openBraces > 0 && endLine < document.lineCount);
        endLine--; // Adjust to include the last line with the closing brace
    }

    const lineText = document.lineAt(start.line).text;
    let match;
    let functionName = "Function";

    while ((match = functionRegex.exec(lineText)) !== null) {
        functionName = match[1] || match[2] || match[3] || match[4];
        if (functionName) {
            break;
        }
    }

    const end = new vscode.Position(endLine, document.lineAt(endLine).text.length);
    const range = new vscode.Range(start, end);
    return {text: document.getText(range), functionName};
}


module.exports = {
    showWebview,
    getFunctionText
};
