const vscode = require('vscode');

function getHoverProvider(language) {
    return function (document, position) {
        const line = document.lineAt(position.line);
        const lineText = line.text;

        // Check if the line is commented out
        if ((language === 'Python' && lineText.trim().startsWith('#')) ||
            (language === 'JavaScript' && lineText.trim().startsWith('//'))) {
            return undefined; // No hover for commented lines
        }

        let pattern;
        if (language === 'Python') {
            pattern = /(?:^\s*def\s+(\w+)\s*\(.*\):)|(?:^\s*class\s+\w+[^:]*:\s*\n(?:\s+.*)*^\s*def\s+(\w+)\s*\(.*\):)/gm;
        } else if (language === 'JavaScript') {
            pattern = /function\s+(\w+)\s*\(.*?\)|[const|let|var]\s+(\w+)\s*=\s*\(.*?\)\s*=>|[const|let|var]\s+(\w+)\s*=.*?function(?:\s+\w+)?\s*\(.*?\)/;
        }

        const range = document.getWordRangeAtPosition(position, pattern);
        if (range) {
            const functionNameMatch = document.getText(range).match(pattern);
            const functionName = functionNameMatch ? functionNameMatch[1] || functionNameMatch[2] || functionNameMatch[3] : "Function";
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
