const vscode = require('vscode');
const fetch = require('cross-fetch');

async function queryHuggingFaceAPI(data) {

    const config = vscode.workspace.getConfiguration('errorExtension');
    const API_LINK = config.get('apiLink', ''); // Default link
    const API_TOKEN = config.get('apiToken', ''); // Default to empty token

    if (!API_TOKEN) {
        throw new Error('API Token is not set.');
    }

    const settings = {
        headers: {
            "Authorization": `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
            ...data,
            max_length: 500, // Set max tokens. Adjust based on your experience with average word lengths
            min_length: 250, // Set min tokens
            length_penalty: 1.0 // Adjusts likelihood of shorter responses
        })
    };

    const response = await fetch(API_LINK, settings);

    if (!response.ok) {
        console.error("API request failed:", await response.text());
        throw new Error('Failed to fetch from Hugging Face API');
    }

    return await response.json();
}

function adjustTextLength(text, minWords, maxWords) {
    let words = text.split(/\s+/);
    if (words.length > maxWords) {
        return words.slice(0, maxWords).join(' ') + '...';
    } else if (words.length < minWords) {
        // Add more descriptive or generic text to meet the minimum word requirement
        text += "\n\nConsider using optimized data structures for better performance.";
        words = text.split(/\s+/);
        if (words.length < minWords) {
            text += " Ensure that all loops and recursive functions are necessary and efficient.";
        }
    }
    return text;
}

function processApiResponseForCompleteCode(apiResult) {
    if (apiResult && apiResult.length > 0 && apiResult[0].generated_text) {
        return apiResult[0].generated_text.replace(/# Complete the code:\n/g, ''); // Remove placeholder if not needed
    }
    return "No code generated.";
}


function processApiResponseForExplainCode(apiResult, originalText) {
    if (apiResult && apiResult.length > 0 && apiResult[0].generated_text) {
        let formattedText = apiResult[0].generated_text.replace(originalText, '');

        // Basic formatting to clean and organize the output
        formattedText = formattedText
            .replace(/"""/g, '')  // Remove extra quotes that might be left over
            .trim();  // Remove leading and trailing whitespace
            

        // Reformat to enhance readability
        formattedText = formattedText
            .replace(/IMPROVEMENT = /, '\n\n**Improvement Suggestion:**\n')
            .replace(/Function for/, '\n**Function Description:**\n')
            .replace(/For iterating the examples,/, '\n\nFor iterating the examples,');

        return formattedText;
    }
    return "No explanation generated.";
}

module.exports = {
    queryHuggingFaceAPI,
    adjustTextLength,
    processApiResponseForCompleteCode,
    processApiResponseForExplainCode
};
