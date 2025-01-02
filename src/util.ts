import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import levenshtein from "fast-levenshtein";

export async function getFilePathURI(fileName: string) {
    const filePath = pathToFileURL(path.join(__dirname, "..", fileName));

    if (fs.existsSync(filePath)) 
        return filePath.toString();
    else throw new Error(`File does not exist ${filePath.href}`);
}

export function compareTexts(textA: string, textB: string) {
    // remove all punctuations and convert to lowercase
    function removePunctuation(text: string) {
        return text
            .replace(/[.,/#!$%^&*;:'"{}=\-_`~()]/g, "")
            .replace(/\s{2,}/g, " ")
            .toLowerCase();
    }

    textA = removePunctuation(textA);
    textB = removePunctuation(textB);

    const levenshteinDistance = levenshtein.get(textA, textB);
    const longerString = textA.length > textB.length ? textA : textB;


    const accuracy = (1 - (levenshteinDistance / longerString.length)) * 100;
    return `${accuracy.toFixed(2)}%`;
    // console.log(`Accuracy of text A compared to text B: ${accuracy.toFixed(2)}%`);
}
