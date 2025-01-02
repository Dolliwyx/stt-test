import "dotenv/config";
import fs from "fs";
import OpenAI from "openai";
import { v1p1beta1 as speech } from "@google-cloud/speech";
import { TranscribeClient, StartTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import path from "path";
import { Stopwatch } from "@sapphire/stopwatch";
import { compareTexts } from "./util";

const GoogleSpeechToText = new speech.SpeechClient({ apiKey: process.env.GCP_API_KEY as string });
const OpenAIWhisper = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY as string
});
const AmazonTranscribe = new TranscribeClient({
    region: "ap-southeast-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
    }
});

// read file as text
const REFERENCE_TEXT = fs.readFileSync(path.join(__dirname, "../transcripts/01.txt"), "utf-8");

async function transcribeGoogleSpeechToText(chunked = false) {
    console.log("Google Speech to Text: Transcribing...");
    const stopwatch = new Stopwatch();

    if (chunked) {
        let txt = "";

        for (let i = 0; i < 5; i++) {
            const stopwatch2 = new Stopwatch();
            const [response] = await GoogleSpeechToText.recognize({
                audio: {
                    content: fs.readFileSync(path.join(__dirname, `../audio/chunked/chunk00${i}.mp3`)).toString("base64")
                },
                config: {
                    encoding: "MP3",
                    sampleRateHertz: 16000,
                    useEnhanced: true,
                    languageCode: "en-PH"
                }
            });

            if (!response.results || !response.results.length) return console.log("Google Speech to Text: No results");

            const transcription = response.results.map((result) => result.alternatives![0].transcript).join("\n");
            console.log(`Google Speech to Text: Transcription #${i + 1} complete (Took: ${stopwatch2.stop()})`);
            txt += transcription + "\n";
        }

        return console.log(
            `----------- Google Speech to Text: Transcription complete (Took: ${stopwatch.stop()} | Accuracy: ${compareTexts(txt, REFERENCE_TEXT)})\n\n`,
            txt,
            "-----------"
        );
    }

    const [operation] = await GoogleSpeechToText.longRunningRecognize({
        audio: {
            uri: "gs://audio-sttbucket/taglish-audio.mp3"
        },
        config: {
            encoding: "MP3",
            sampleRateHertz: 16000,
            useEnhanced: true,
            languageCode: "en-PH"
        }
    });

    const [response] = await operation.promise();

    if (!response.results || !response.results.length) return console.log("Google Speech to Text: No results");

    const transcription = response.results.map((result) => result.alternatives![0].transcript).join("\n");

    return console.log(
        `----------- Google Speech to Text: Transcription complete (Took: ${stopwatch.stop()} | Accuracy: ${compareTexts(transcription, REFERENCE_TEXT)})\n\n`,
        transcription,
        "-----------"
    );
}

async function transcribeAmazonTranscribe(chunked = false) {
    if (chunked) {
        for (let i = 0; i < 5; i++) {
            const command = new StartTranscriptionJobCommand({
                TranscriptionJobName: `transcribe-job-${i}`,
                Media: {
                    MediaFileUri: `s3://stt-audio-bucket/chunked/chunk00${i}.mp3`
                },
                IdentifyLanguage: true
            });

            try {
                console.log("Amazon Transcribe: Transcribing...");
                const response = await AmazonTranscribe.send(command);
                console.log("Amazon Transcribe: Transcription sent!");
                console.log(response.TranscriptionJob);
            } catch (error) {
                console.log(error);
            }
        }

        return;
    }

    const command = new StartTranscriptionJobCommand({
        TranscriptionJobName: "sample-transcribe-job",
        Media: {
            MediaFileUri: "s3://stt-audio-bucket/taglish-audio.mp3"
        },
        IdentifyLanguage: true
    });

    try {
        console.log("Amazon Transcribe: Transcribing...");
        const response = await AmazonTranscribe.send(command);
        console.log("Amazon Transcribe: Transcription sent!");
        console.log(response.TranscriptionJob);
    } catch (error) {
        console.log(error);
    }
}

async function transcribeOpenAIWhisper(chunked = false) {
    console.log("OpenAI Whisper: Transcribing...");
    const stopwatch = new Stopwatch();

    if (chunked) {
        let txt = "";

        for (let i = 0; i < 5; i++) {
            const stopwatch2 = new Stopwatch();
            const transcription = await OpenAIWhisper.audio.transcriptions.create({
                file: fs.createReadStream(path.join(__dirname, `../audio/chunked/chunk00${i}.mp3`)),
                model: "whisper-1"
            });

            console.log(`OpenAI Whisper: Transcription #${i + 1} complete (Took: ${stopwatch2.stop()})`);
            txt += transcription.text + "\n";
        }

        return console.log(
            `----------- OpenAI Whisper: Transcription complete (Took: ${stopwatch.stop()} | Accuracy: ${compareTexts(txt, REFERENCE_TEXT)})\n\n`,
            txt,
            "-----------"
        );
    }

    const transcription = await OpenAIWhisper.audio.transcriptions.create({
        file: fs.createReadStream(path.join(__dirname, "../audio/taglish-audio.mp3")),
        model: "whisper-1"
    });

    console.log(
        `----------- OpenAI Whisper: Transcription complete (Took: ${stopwatch.stop()} | Accuracy: ${compareTexts(transcription.text, REFERENCE_TEXT)})\n`,
        transcription.text,
        "-----------"
    );
}

async function main() {
    // console.log(process.env);
    // run all tests here
    console.log("Testing Speech to Text services (Whole)...");
    await transcribeAmazonTranscribe();
    await transcribeGoogleSpeechToText();
    await transcribeOpenAIWhisper();

    console.log("Testing Speech to Text services (Chunked)...");
    await transcribeAmazonTranscribe(true);
    await transcribeGoogleSpeechToText(true);
    await transcribeOpenAIWhisper(true);
}

main();
