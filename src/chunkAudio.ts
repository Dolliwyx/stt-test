import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

const inputFilePath = path.join(__dirname, "../audio/cut-sample-audio.mp3"); // Change this to your audio file path
const outputDir = path.join(__dirname, "../audio/chunked"); // Directory to save the chunks

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Function to chunk the audio file
function chunkAudio(inputFile: string, outputDir: string, segmentDuration: number) {
    ffmpeg(inputFile)
        .outputOptions([`-f segment`, `-segment_time ${segmentDuration}`, `-c copy`, `-reset_timestamps 1`])
        .output(path.join(outputDir, "chunk%03d.mp3")) // Output file pattern
        .on("end", () => {
            console.log("Audio chunking finished.");
        })
        .on("error", (err) => {
            console.error("Error during audio chunking:", err);
        })
        .run();
}

// Call the function with 60 seconds (1 minute) segment duration
chunkAudio(inputFilePath, outputDir, 60);
