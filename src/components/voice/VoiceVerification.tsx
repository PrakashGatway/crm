import React, { useState, useEffect, useRef } from "react";
import {
    Mic,
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    Settings,
    Monitor,
    Chrome,
    AlertCircle,
    Play,
    StopCircle,
    Volume2
} from "lucide-react";
import { px } from "framer-motion";

interface VoiceVerificationProps {
    onComplete: () => void;
    onBack: () => void;
    sessionId: string | null;
    sectionName?: string;
}

const TEST_SENTENCE = "Testing one, two, three. My microphone is working fine.";

const VoiceVerification: React.FC<VoiceVerificationProps> = ({
    onComplete,
    onBack,
    sessionId,
    sectionName = "Speaking Section"
}) => {
    // State
    const [currentStep, setCurrentStep] =
        useState<"system_check" | "voice_test" | "general_instruction">("system_check");

    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState("");
    const [spokenText, setSpokenText] = useState("");
    const [accuracy, setAccuracy] = useState(0);
    const [hasResult, setHasResult] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isSupported, setIsSupported] = useState(true);
    const [recordedAudio, setRecordedAudio] = useState<string>("");
    const [isPlaying, setIsPlaying] = useState(false);

    // Refs
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef<string>("");
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioElementRef = useRef<HTMLAudioElement>(null);




    // Initialize system requirements
    useEffect(() => {
        checkSystemRequirements();
    }, []);

    // Initialize speech recognition
    useEffect(() => {
        if (currentStep === "voice_test") {
            initSpeechRecognition();
        }
    }, [currentStep]);

    const checkSystemRequirements = () => {
        // Check system requirements
    };

    const initSpeechRecognition = () => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognitionAPI) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.continuous = true;

        recognition.onresult = (event: any) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcriptRef.current += " " + event.results[i][0].transcript;
            }
        };

        recognition.onend = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }

            setIsRecording(false);
            setStatus("Recording finished");

            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }

            const spoken = transcriptRef.current.trim();
            setSpokenText(spoken || "Nothing detected");

            if (!spoken) {
                setAccuracy(0);
                setHasResult(true);
                return;
            }

            const calculatedAccuracy = calculateAccuracy(TEST_SENTENCE.toLowerCase(), spoken.toLowerCase());
            setAccuracy(calculatedAccuracy);
            setHasResult(true);
        };

        recognition.onerror = (event: any) => {

            setStatus(`Error: ${event.error}`);
            setIsRecording(false);

            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }

            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };

        recognitionRef.current = recognition;
    };

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 5) {
                        if (recognitionRef.current) {
                            recognitionRef.current.stop();
                        }
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording]);

    const startRecording = async () => {
        if (!recognitionRef.current) {
            setStatus("Speech recognition not initialized");
            return;
        }

        // Reset states
        setStatus("");
        setSpokenText("");
        setAccuracy(0);
        setHasResult(false);
        setRecordingTime(0);
        setRecordedAudio("");
        transcriptRef.current = "";
        audioChunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            mediaStreamRef.current = stream;

            startAudioRecording(stream);

            setIsRecording(true);
            setStatus("Recording... Please speak the sentence");

            // Start recognition
            try {
                recognitionRef.current.start();
            } catch (recognitionError) {

                setStatus("Speech recognition failed to start");
                setIsRecording(false);
                return;
            }

            // Auto-stop after 5 seconds
            timerRef.current = setTimeout(() => {
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                }
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }
                setIsRecording(false);
            }, 5000);

        } catch (err) {

            setStatus("Microphone access denied or not available");
            setIsRecording(false);
        }
    };

    const startAudioRecording = (stream: MediaStream) => {
        try {
            // Try different MIME types
            const mimeTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/mp4',
                'audio/ogg;codecs=opus',
                ''
            ];

            let options = {};
            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    if (mimeType) {
                        options = { mimeType };
                    }
                    break;
                }
            }

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);

                }
            };

            mediaRecorder.onstop = () => {


                if (audioChunksRef.current.length === 0) {

                    setStatus("Recording failed: No audio data");
                    return;
                }

                try {
                    const audioBlob = new Blob(audioChunksRef.current, {
                        type: mediaRecorder.mimeType || 'audio/webm'
                    });


                    const audioUrl = URL.createObjectURL(audioBlob);


                    setRecordedAudio(audioUrl);

                    // Test if audio can be played
                    const testAudio = new Audio();
                    testAudio.src = audioUrl;
                    testAudio.oncanplaythrough = () => {

                    };
                    testAudio.onerror = (e) => {

                    };

                } catch (blobError) {

                    setStatus("Recording failed: Could not create audio file");
                }
            };

            mediaRecorder.onerror = (e) => {

                setStatus("Recording error occurred");
            };


            mediaRecorder.start(100); // Collect data every 100ms


        } catch (err) {

            setStatus("Audio recording not supported in this browser");
        }
    };

    const playRecording = () => {


        if (!recordedAudio) {

            setStatus("No recording available");
            return;
        }


        if (!audioElementRef.current) {

            const newAudio = new Audio(recordedAudio);
            audioElementRef.current = newAudio;
        } else {

            audioElementRef.current.src = recordedAudio;
        }

        const audioElement = audioElementRef.current;


        audioElement.onended = () => {

            setIsPlaying(false);
        };

        audioElement.onerror = (e) => {

            setStatus("Error playing audio");
            setIsPlaying(false);
        };

        if (isPlaying) {

            audioElement.pause();
            setIsPlaying(false);
        } else {

            audioElement.play()
                .then(() => {

                    setIsPlaying(true);
                    setStatus("Playing recording...");
                })
                .catch(err => {


                    // Try with new audio element
                    const tempAudio = new Audio(recordedAudio);
                    tempAudio.play()
                        .then(() => {

                            setIsPlaying(true);
                            audioElementRef.current = tempAudio;
                        })
                        .catch(secondErr => {

                            setStatus(`Cannot play: ${err.message}`);
                        });
                });
        }
    };

    const calculateAccuracy = (expected: string, spoken: string): number => {
        const expectedWords = expected.split(" ");
        const spokenWords = spoken.split(" ");

        let matched = 0;
        expectedWords.forEach(word => {
            if (spokenWords.includes(word)) matched++;
        });

        return (matched / expectedWords.length) * 100;
    };

    const passed = accuracy >= 50;
    const canContinue = hasResult && passed;

    // System Requirements Screen (Screenshot 67)
    const renderSystemCheck = () => {
        return (
            <div className="min-h-screen  bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">


                <audio
                    ref={audioElementRef}
                    style={{ display: 'none' }}
                    controls
                    preload="metadata"

                />
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Back</span>
                        </button>


                    </div>

                    {/* System Requirements Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 p-8 mb-2 max-w-3xl mx-auto">

                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                            System Requirement for Test
                        </h2>

                        <div className="divide-y divide-gray-200 dark:divide-gray-700">

                            {/* JavaScript */}
                            <div className="flex items-center justify-between py-5">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        JavaScript
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Enabled
                                    </p>
                                </div>

                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500 text-white text-sm">
                                    ✓
                                </div>
                            </div>

                            {/* Resolution */}
                            <div className="flex items-center justify-between py-5">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        Resolution (Laptop & Desktop)
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        1280 X 720
                                    </p>
                                </div>

                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500 text-white text-sm">
                                    ✓
                                </div>
                            </div>

                            {/* Browser */}
                            <div className="flex items-center justify-between py-5">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        Recommended Browser
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Google Chrome
                                    </p>
                                </div>

                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500 text-white text-sm">
                                    ✓
                                </div>
                            </div>

                            {/* Microphone */}
                            <div className="flex items-center justify-between py-5">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        Microphone
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Enabled
                                    </p>
                                </div>

                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500 text-white text-sm">
                                    ✓
                                </div>
                            </div>

                        </div>
                    </div>


                    {/* Next Button */}
                    <div className="text-center">
                        <button
                            onClick={() => setCurrentStep("voice_test")}
                            className="px-4 py-2 bg-[#007cd4] text-white font-bold text-medium rounded-sm hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg flex items-center gap-3 mx-auto"
                        >
                            Next
                            <ArrowRight className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Microphone Check Screen 
    const renderVoiceTest = () => {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
                <div className="w-9xl">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => setCurrentStep("system_check")}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Back</span>
                        </button>


                    </div>

                    {/* Microphone Check Card */}
                    <div className=" gap-[20px] dark:bg-gray-800 rounded-2xl  p-8 mb-8 flex ">
                        <div className="title w-[50%]"> <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 ">
                            Microphone Check
                        </h2>
                            {/* Instructions */}
                            <div className="mb-8">
                                <p className="text-gray-700 text-sm dark:text-gray-300 mb-4">
                                    To Improve The Audio Recording Quality in The Classroom (Or Anywhere Your Student Use The Headphone), We Suggest That You Follow These Recommendations:
                                </p>

                                <div className="">
                                    <p className="font-bold text-gray-800 dark:text-gray-200 ">
                                        Microphone positioning:
                                    </p>
                                    <p className="text-gray-700 text-sm dark:text-gray-300">
                                        Place headset microphone two fingers width from mouth corner and below lip for optimal sound quality and to record the voice.
                                    </p>
                                </div>

                                <div className=" ">
                                    <p className="font-bold text-gray-800 dark:text-gray-200 ">
                                        Note:
                                    </p>
                                    <p className="text-gray-700 text-sm dark:text-gray-300">
                                        Once positioned correctly, you should not touch the headset or move the microphone. Speak loudly and clearly to capture the voice on microphone.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-center">
                                <img className="w-70" src="/images/logo/microphone2.avif" alt="" /></div>

                        </div>



                        {/* Divider */}
                        <div className="border-t border-gray-300 dark:border-gray-700  "></div>

                        {/* Test Sentence */}
                        <div className="text-center mb-2">
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                To check your microphone please repeat below sentence
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                                <p className="text-base text-gray-900 dark:text-white font-medium italic">
                                    "{TEST_SENTENCE}"
                                </p>
                            </div>
                            {/* Divider */}
                            <div className="border-t border-gray-300 dark:border-gray-700 my-2"></div>

                            {/* Recording Controls */}
                            <div className="space-y-2">
                                {/* Status */}
                                {status && (
                                    <div className={`p-4 rounded-xl text-center ${status.includes('Recording finished')
                                        ? 'text-green-700 dark:text-green-300'
                                        : status.includes('Error')
                                            ? ' text-red-700 dark:text-red-300'
                                            : 'text-blue-700 dark:text-blue-300'
                                        }`}>
                                        <div className="flex items-center justify-center gap-2">
                                            {isRecording && (
                                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                            )}
                                            <span>{status}</span>
                                            {isRecording && (
                                                <span className="font-bold ml-2">({recordingTime}/5s)</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Check Microphone Button */}
                                <button
                                    onClick={startRecording}
                                    disabled={isRecording && passed}
                                    className={`w-full py-2 rounded-xl font-bold text-base flex items-center justify-center gap-3 ${isRecording
                                        ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
                                        : 'bg-[#007cd4] text-white'
                                        }`}
                                >
                                    <Mic className="h-6 w-6" />
                                    {isRecording ? 'Recording...' : 'Check Microphone'}
                                </button>

                                {/* Results Section */}
                                {hasResult && (
                                    <div className={`p-2 rounded-xl ${passed
                                        ? '  text-base '
                                        : ' text-base dark:border-red-800'
                                        }`}>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-3 mb-4">
                                                {passed ? (
                                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                                ) : (
                                                    <AlertCircle className="h-8 w-8 text-red-500" />
                                                )}
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {passed ? 'Microphone Working!' : 'Microphone Check Failed'}
                                                </h3>
                                            </div>

                                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                                                Accuracy: <span className="font-bold">{accuracy.toFixed(1)}%</span>
                                            </p>

                                            <div className="flex justify-center">
                                                {recordedAudio && (
                                                    <button
                                                        onClick={playRecording}
                                                        className="flex items-center mx-2 font-bold text-sm gap-2 p-2 bg-[#007cd4]  text-white rounded-lg transition-colors"
                                                    >
                                                        {isPlaying ? (
                                                            <>
                                                                <StopCircle className="h-5 w-5" />
                                                                Stop Playback
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="h-5 w-5" />
                                                                Play Recording
                                                            </>
                                                        )}
                                                    </button>

                                                )}
                                                {/* Next Button */}
                                                <div className="text-center">
                                                    {canContinue ? (
                                                        <button
                                                            onClick={() => setCurrentStep("general_instruction")}

                                                            className="p-3  text-sm bg-green-600 text-white font-bold  rounded-xl  transition-all shadow-lg flex text-base items-center gap-3 mx-auto"
                                                        >
                                                            Next
                                                            <ArrowRight className="h-6 w-6" />
                                                        </button>
                                                    ) : hasResult && !passed ? (
                                                        <button
                                                            onClick={startRecording}
                                                            className="p-3  text-sm bg-red-600 text-white font-bold  rounded-xl  transition-all shadow-lg flex text-base items-center gap-3 mx-auto"
                                                        >
                                                            Try Again
                                                            <ArrowRight className="h-4 w-4" />
                                                        </button>
                                                    ) : null}
                                                </div>

                                            </div>




                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>


                    </div>


                </div>
            </div>
        );
    };



    const renderGeneralInstructions = () => {


        return (
            <div className=" bg-gray-200 p-1">
                <div className=" mx-auto  rounded-md p-6">

                    {/* Header */}
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        General Instructions
                    </h2>
                    <div className="h-[2px] bg-red-500 mb-6"></div>

                    {/* Instructions List */}
                    <ul className="space-y-4 text-sm text-gray-800 mb-8">
                        <li className="flex items-start gap-2">
                            <span>🌐</span>
                            <span>Use a computer with Chrome or Firefox browser.</span>
                        </li>

                        <li className="flex items-start gap-2">
                            <span>🎤</span>
                            <span>
                                Please use a microphone. If you use your computer’s default
                                microphone, sometimes there is a lot of disturbance.
                            </span>
                        </li>

                        <li className="flex items-start gap-2">
                            <span>⏱️</span>
                            <span>
                                A timed question will have an active timer to remind you of how
                                much time is left.
                            </span>
                        </li>

                        <li className="flex items-start gap-2">
                            <span>📤</span>
                            <span>The test will be automatically submitted after it finishes.</span>
                        </li>

                        <li className="flex items-start gap-2">
                            <span>📌</span>
                            <span>The name of each part is on the top of the page.</span>
                        </li>

                        <li className="flex items-start gap-2">
                            <span>🔊</span>
                            <span>Please follow the audio instructions to complete the test.</span>
                        </li>

                        <li className="flex items-start gap-2">
                            <span>📝</span>
                            <span>
                                Click submit button appears on the Bottom to submit test.
                            </span>
                        </li>
                    </ul>

                    {/* Speaking Instruction Table */}
                    <div className="border  rounded-md overflow-hidden mb-28">
                        <div className=" px-4 py-2  font-semibold text-gray-900">
                            Speaking Instruction
                        </div>

                        <table className="w-xl border border-black border-collapse text-sm text-left">
                            <thead>
                                <tr>
                                    <th className="border border-black px-4 py-2">Part</th>
                                    <th className="border border-black px-4 py-2">Question Type</th>
                                    <th className="border border-black px-4 py-2">Time Allowed</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-black px-4 py-2">Part 1</td>
                                    <td className="border border-black px-4 py-2">
                                        Introduction And Interview
                                    </td>
                                    <td className="border border-black px-4 py-2">4–5 minutes</td>
                                </tr>
                                <tr>
                                    <td className="border border-black px-4 py-2">Part 2</td>
                                    <td className="border border-black px-4 py-2">Topic</td>
                                    <td className="border border-black px-4 py-2">3–4 minutes</td>
                                </tr>
                                <tr>
                                    <td className="border border-black px-4 py-2">Part 3</td>
                                    <td className="border border-black px-4 py-2">Topic Discussion</td>
                                    <td className="border border-black px-4 py-2">5–6 minutes</td>
                                </tr>
                            </tbody>
                        </table>

                    </div>

                    {/* Start Test Button */}
                    <div className="text-center">
                        <button
                            onClick={onComplete}
                            className="px-6 py-2 bg-[#007cd4] text-white font-semibold rounded-sm "
                        >
                            Start Test →
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    if (currentStep === "system_check") return renderSystemCheck();
    if (currentStep === "voice_test") return renderVoiceTest();
    return renderGeneralInstructions();

};

export default VoiceVerification;