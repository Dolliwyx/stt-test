import path from "path";
import { pathToFileURL } from "url";
import fs from "fs";

export async function getFilePathURI(fileName: string) {
    const filePath = pathToFileURL(path.join(__dirname, "..", fileName));

    if (fs.existsSync(filePath)) 
        return filePath.toString();
    else throw new Error(`File does not exist ${filePath.href}`);
}

function splitText(text: string) {
    return text
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word);
}

export function calculateAccuracy(sourceArray: string[], referenceArray: string[]) {
    let matches = 0;

    // Create a Set for faster lookups
    const referenceSet = new Set(referenceArray);

    // Count matches
    sourceArray.forEach((item) => {
        if (referenceSet.has(item)) {
            matches++;
        }
    });

    // Calculate accuracy
    const accuracy = (matches / sourceArray.length) * 100; // in percentage
    return accuracy;
}

export function compareTexts(textA: string, textB: string) {
    // remove all punctuations and convert to lowercase

    function removePunctuation(text: string) {
        return text
            .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
            .replace(/\s{2,}/g, " ")
            .toLowerCase();
    }

    textA = removePunctuation(textA);
    textB = removePunctuation(textB);

    const sourceArray = splitText(textA.toLowerCase());
    const referenceArray = splitText(textB.toLowerCase());

    const accuracy = calculateAccuracy(sourceArray, referenceArray);
    return `${accuracy.toFixed(2)}%`;
    // console.log(`Accuracy of text A compared to text B: ${accuracy.toFixed(2)}%`);
}
