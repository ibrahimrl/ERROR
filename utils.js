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
            <style>
                body {
                    margin: 0;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #f3f4f6;
                    color: #2c3e50;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    overflow: hidden; /* Disable body scrolling */
                }
                .container {
                    background: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    padding: 20px;
                    max-width: 90%;
                    max-height: 90vh;
                    overflow: auto; /* Enable scrolling within the container */
                }
                h1 {
                    font-size: 24px;
                    color: #333;
                }
                p {
                    font-size: 16px;
                    line-height: 1.6;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${functionName} Explanation</h1>
                <p>${content}</p>
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
