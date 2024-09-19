const vscode = require('vscode');

function showWebview(editor, title, content, context, modelType, Model) {
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
            if (message.command === 'submitRating') {
                appendToJSONFile(message, context, content, modelType, Model);
                panel.dispose(); // Ensure the panel is closed after submitting the rating
                vscode.window.showInformationMessage('Thank you for your feedback!');
            }
        },
        undefined,
        context.subscriptions
    );
}

function showWebviewCompleteCode(editor, title, content, context, modelType, Model) {
    const panel = vscode.window.createWebviewPanel(
        'completeCode', // Identifies the type of the webview. Used internally
        "Rating", // Title of the panel displayed to the user
        vscode.ViewColumn.Beside, // Shows the webview to the side of the editor
        {
            enableScripts: true, // Allow scripts to run in the webview
            retainContextWhenHidden: true // Optional, but can improve performance
        } 
    );
    panel.webview.html = getWebviewContentCodeCompletion();

    panel.webview.onDidReceiveMessage(
        message => {
            if (message.command === 'submitRating') {
                appendToJSONFile(message, content, context, modelType, Model);
                panel.dispose(); // Ensure the panel is closed after submitting the rating
                vscode.window.showInformationMessage('Thank you for your feedback!');
            }
        },
        undefined,
        context.subscriptions
    );  
}

function getWebviewContent(content, functionName) {

    const config = vscode.workspace.getConfiguration('errorExtension');
    const rateModelPerformance = config.get('rateModelPerformance', true);

    let ratingHTML = '';
    if (rateModelPerformance) {
        ratingHTML = `
            <div class="rating">
                <span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span>
            </div>
            <input type="text" id="comment" class="comment-box" placeholder="Add a comment...">
            <button onclick="sendMessage()" class="submit-btn">Submit</button>
        `;
    }

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
                    ${ratingHTML}
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                document.addEventListener('DOMContentLoaded', function() {
                    const stars = document.querySelectorAll('.rating > span');
                    const commentBox = document.getElementById('comment');
                    const submitButton = document.querySelector('.submit-btn');
                    let rating = 0;

                    stars.forEach((star, index) => {
                        star.addEventListener('click', () => {
                            rating = 5 - index;
                            updateStars(rating);
                            commentBox.style.display = 'block'; // Show the comment box
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

                    submitButton.addEventListener('click', function() {
                        const comment = commentBox.value;
                        vscode.postMessage({
                            command: 'submitRating',
                            rating: rating,
                            comment: comment,
                        });
                        panel.dispose(); // Close the panel after submission
                    });
                });
            </script>
        </body>
        </html>
    `;
}

function getWebviewContentCodeCompletion() {

    const config = vscode.workspace.getConfiguration('errorExtension');
    const rateModelPerformance = config.get('rateModelPerformance', true);

    let ratingHTML = '';
    if (rateModelPerformance) {
        ratingHTML = `
            <div class="rating">
                <span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span>
            </div>
            <input type="text" id="comment" class="comment-box" placeholder="Add a comment...">
            <button onclick="sendMessage()" class="submit-btn">Submit</button>
        `;
    }

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Completion</title>
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
            <div class="navbar">Code Completion</div>
            <div class="container">
                <h1>Rate the model performance</h1>
                <div class="content">
                    ${ratingHTML}
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                document.addEventListener('DOMContentLoaded', function() {
                    const stars = document.querySelectorAll('.rating > span');
                    const commentBox = document.getElementById('comment');
                    const submitButton = document.querySelector('.submit-btn');
                    let rating = 0;

                    stars.forEach((star, index) => {
                        star.addEventListener('click', () => {
                            rating = 5 - index;
                            updateStars(rating);
                            commentBox.style.display = 'block'; // Show the comment box
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

                    submitButton.addEventListener('click', function() {
                        const comment = commentBox.value;
                        vscode.postMessage({
                            command: 'submitRating',
                            rating: rating,
                            comment: comment,
                        });
                        panel.dispose(); // Close the panel after submission
                    });
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

function appendToJSONFile(data, content, context, modelType, Model) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(vscode.workspace.rootPath || '', 'reports.json');

    fs.readFile(filePath, (err, fileData) => {
        let json = [];
        if (!err && fileData) {
            json = JSON.parse(fileData.toString()); // Parse existing JSON file
        }
        
        json.push({
            'Request': 'hellp',
            'Model Type': modelType,
            'Model': Model,
            'Request': content,
            'Model Response': context,
            rating: data.rating,
            comment: data.comment
        });

        fs.writeFile(filePath, JSON.stringify(json, null, 2), (writeErr) => {
            if (writeErr) {
                vscode.window.showErrorMessage("Failed to save report.");
            } else {
                vscode.window.showInformationMessage("Report saved successfully.");
            }
        });
    });
}



module.exports = {
    showWebview,
    getFunctionText,
    showWebviewCompleteCode
};
