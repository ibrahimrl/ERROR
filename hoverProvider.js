const vscode = require('vscode');

function getHoverProvider(language) {
    return function (document, position) {
        const line = document.lineAt(position.line);
        const lineText = line.text;

        // Define regex for Todo comments
        let todoPattern;
        let commentPattern; // Pattern to check if a line is a comment
        if (language === 'Python') {
            todoPattern = /^\s*#\s*Todo:/i; // Python Todo
            commentPattern = /^\s*#/; // Python comment
        } else if (language === 'JavaScript') {
            todoPattern = /^\s*\/\/\s*Todo:/i; // JavaScript Todo
            commentPattern = /^\s*\/\//; // JavaScript comment
        }

        if (todoPattern && todoPattern.test(lineText)) {
            let todoText = lineText;
            let currentLine = position.line;

            // Include subsequent lines that are also comments
            while (true) {
                currentLine += 1;
                if (currentLine >= document.lineCount) break;
                const nextLineText = document.lineAt(currentLine).text;
                if (!commentPattern.test(nextLineText) || nextLineText.trim() === '') break; // Stop if it's not a comment or empty
                todoText += '\n' + nextLineText;
            }

            const markdownString = new vscode.MarkdownString();
            markdownString.appendMarkdown(`### Actions for TODO\n`);
            markdownString.appendMarkdown(`[🔨 Complete the code](command:ERROR.completeCode?${encodeURIComponent(JSON.stringify({text: lineText, range: {start: {line: position.line, character: 0}}}))})`);
            markdownString.isTrusted = true; // Allows command execution from markdown

            return new vscode.Hover(markdownString, new vscode.Range(position.line, 0, currentLine - 1, document.lineAt(currentLine - 1).text.length));
        }

        // Check if the line is commented out
        if ((language === 'Python' && lineText.trim().startsWith('#')) ||
            (language === 'JavaScript' && lineText.trim().startsWith('//'))) {
            return undefined; // No hover for commented lines
        }

        let pattern;
        if (language === 'Python') {
            pattern = /^\s*def\s+(\w+)\s*\([^)]*\)\s*->\s*[^:]*:|^\s*def\s+(\w+)\s*\([^)]*\)\s*:|^\s*class\s+\w+[^:]*:\s*\n(?:\s+.*)*^\s*def\s+(\w+)\s*\([^)]*\)\s*->\s*[^:]*:|^\s*class\s+\w+[^:]*:\s*\n(?:\s+.*)*^\s*def\s+(\w+)\s*\([^)]*\)\s*:/gm;
        } else if (language === 'JavaScript') {
            pattern = /function\s+(\w+)\s*\(.*?\)|[const|let|var]\s+(\w+)\s*=\s*\(.*?\)\s*=>|[const|let|var]\s+(\w+)\s*=.*?function(?:\s+\w+)?\s*\(.*?\)/;
        }


        const range = document.getWordRangeAtPosition(position, pattern);
        if (range) {
            const text = document.getText(range);
            let match;
            let functionName = "Function";

            while ((match = pattern.exec(text)) !== null) {
                functionName = match[1] || match[2] || match[3] || match[4];
                if (functionName) {
                    break;
                }
            }

            const functionLine = range.start.line;
            let endLine = functionLine;

            if (language === 'Python') {
                const startIndentation = document.lineAt(functionLine).firstNonWhitespaceCharacterIndex;
                while (endLine + 1 < document.lineCount) {
                    const nextLine = document.lineAt(endLine + 1);
                    const nextLineIndentation = nextLine.firstNonWhitespaceCharacterIndex;
                    if (nextLineIndentation <= startIndentation && nextLine.text.trim() !== '') break;
                    endLine++;
                }
            } else if (language === 'JavaScript') {
                let openBraces = 0;
                do {
                    const lineText = document.lineAt(endLine).text;
                    openBraces += (lineText.match(/{/g) || []).length;
                    openBraces -= (lineText.match(/}/g) || []).length;
                    endLine++;
                } while (openBraces > 0 && endLine < document.lineCount);
                endLine--; // Adjust to include the last line with the closing brace
            }

            const functionRange = new vscode.Range(new vscode.Position(functionLine, 0), new vscode.Position(endLine, document.lineAt(endLine).text.length));
            const functionText = document.getText(functionRange);
            const encodedText = encodeURIComponent(functionText);

            const markdownString = new vscode.MarkdownString();
            markdownString.appendMarkdown(`### Actions for ${functionName}\n`);
            markdownString.appendMarkdown(`[🔨 Complete Code](command:ERROR.completeCode?${encodeURIComponent(JSON.stringify({text: encodedText, range: {start: {line: range.start.line, character: range.start.character}}}))}) &nbsp;&nbsp;&nbsp;&nbsp; [📘 Explain Code](command:ERROR.explainCode?${encodeURIComponent(JSON.stringify({text: encodedText, range: {start: {line: range.start.line, character: range.start.character}}}))})`);
            markdownString.isTrusted = true; // Allows command execution from markdown

            return new vscode.Hover(markdownString, functionRange);
        }
        return undefined;
    }
}

module.exports = {
    getHoverProvider
};
