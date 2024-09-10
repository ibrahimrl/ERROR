const vscode = require('vscode');

function showWebview(editor, title, content, context) {
    const panel = vscode.window.createWebviewPanel(
        'explainCode', // Identifies the type of the webview. Used internally
        title, // Title of the panel displayed to the user
        vscode.ViewColumn.Beside, // Shows the webview to the side of the editor
        {
            enableScripts: true, // Allow scripts to run in the webview
            retainContextWhenHidden: true // Optional, but can improve performance
        } 
    );
    panel.webview.html = getWebviewContent(content, title);

    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'submitRating':
                    vscode.window.showInformationMessage(`Rating: ${message.rating}, Comment: ${message.comment}`);
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
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
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
                .rating {
                    unicode-bidi: bidi-override;
                    direction: rtl;
                    text-align: center;
                    font-size: 2em;
                }
                .rating > span {
                    display: inline-block;
                    position: relative;
                    width: 1.1em;
                    cursor: pointer;
                    color: transparent; /* Default non-selected star color */
                }
                .rating > span:before {
                    content: "\\2605"; /* Unicode star character */
                    position: absolute;
                    left: 0;
                    color: #ccc; /* Default color for non-selected stars */
                }
                .rating > span:hover:before,
                .rating > span:hover ~ span:before,
                .rating > span.active:before,
                .rating > span.active ~ span:before {
                    color: #ffc107; /* Golden color for hover and active states */
                }
                .comment-box {
                    display: none; /* Initially hidden */
                    width: 100%;
                    padding: 10px;
                    margin-top: 10px;
                    border: 2px solid black; 
                    border-radius: 5px;
                }
                .submit-btn {
                    display: none; /* Initially hidden */
                    padding: 10px 20px;
                    background-color: black;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="navbar">Code Explanation</div>
            <div class="container">
                <h1>${functionName} Explanation</h1>
                <div class="content">
                    <p>${content}</p>
                    <div class="rating">
                        <span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span>
                    </div>
                    <input type="text" id="comment" class="comment-box" placeholder="Add a comment...">
                    <button onclick="sendMessage()" class="submit-btn">Submit</button>
                </div>
            </div>
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const stars = document.querySelectorAll('.rating > span');
                    const commentBox = document.getElementById('comment');
                    const submitButton = document.querySelector('.submit-btn');
                    let rating = 0;

                    stars.forEach((star, index) => {
                        star.addEventListener('click', () => {
                            rating = 5 - index;
                            updateStars(rating); // Update the visual state of stars
                            commentBox.style.display = 'block'; // Show the input box
                            submitButton.style.display = 'block'; // Show the submit button
                        });
                    });

                    function updateStars(rating) {
                        stars.forEach((star, idx) => {
                            star.classList.remove('active');
                            if (5 - idx <= rating) {
                                star.classList.add('active');
                            }
                        });
                    }

                    function sendMessage() {
                        const comment = commentBox.value;
                        const vscode = acquireVsCodeApi();
                        vscode.postMessage({
                            command: 'submitRating',
                            rating: rating,
                            comment: comment
                        });
                    }
                });
            </script>
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
