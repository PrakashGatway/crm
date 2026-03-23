import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { zipSync } from 'fflate';
import {
  ChevronLeft,
  Clock,
  Mic,
  Square,
  Volume2,
  Pause,
  Play,
  CheckCircle,
  Send,
  User,
  Lock,
  Video,
  AlertCircle,
} from "lucide-react";
import api from "../../axiosInstance";
import TestHeader from "./speakingHeader";

interface SpeakingTestSectionProps {
  question: {
    _id: string;
    title: string;
    isQuestionGroup: boolean;
    questionGroup: Array<{
      _id: string;
      title: string;
      instruction: string;
      questions: Array<{
        _id: string;
        question: string;
        options: Array<{ label: string; text: string }>;
        explanation: string;
      }>;
      order: number;
      type: string;
      marks: number;
    }>;
    totalQuestions: number;
    content: {
      instruction: string;
      passageTitle?: string;
      passageText?: string;
      transcript?: string;
      imageUrl?: string;
      audioUrl?: string;
      videoUrl?: string;
    };
    cueCard?: {
      prompts: string[];
    };
    timeLimit: number;
  };
  progress: {
    currentSection: number;
    totalSections: number;
    currentQuestion?: number;
    questionsAnswered?: number;
    totalQuestions?: number;
    completionPercentage?: number;
    sectionTimeRemaining?: number;
  };
  onBack: () => void;
  onSubmit: (answers: Array<{
    questionId: string;
    audioUrl: string;
    transcript: string;
    sectionId?: string;
    questionGroupId?: string;
    testId?: string;
    questionText?: string;
  }>) => void;
  onRecord: (action: string, questionId: string) => Promise<void> | void;
  recording?: boolean;
  recordedUrl?: string;
  currentQuestionId?: string;
  sectionId?: string;
}

interface QuestionAnswer {
  questionId: string;
  audioBlob: Blob | null;
  audioUrl: string | null;
  transcript: string;
  duration: number;
  questionGroupId?: string;
  testId?: string;
  sectionId?: string;
}

const SpeakingTestSection: React.FC<SpeakingTestSectionProps> = ({
  question,
  progress,
  onBack,
  onSubmit,
  onRecord,
  recording,
  recordedUrl,
  currentQuestionId,
  sectionId,

}) => {
  const MAX_RECORDING_TIME = 120;
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");
  const [recordedAudio, setRecordedAudio] = useState<string>("");
  const [userManuallyStopped, setUserManuallyStopped] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [autoSpeaking, setAutoSpeaking] = useState(false);
  const [speechEnded, setSpeechEnded] = useState(false);
  const [hasQuestionSpoken, setHasQuestionSpoken] = useState(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackCurrentTime, setPlaybackCurrentTime] = useState(0);
  const [sectionTimeRemaining, setSectionTimeRemaining] = useState<number>(
    progress.sectionTimeRemaining || question.timeLimit * 60
  );
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoPlayed, setVideoPlayed] = useState(false);
  const [autoRecordTriggered, setAutoRecordTriggered] = useState(false);

  const audioTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const autoRecordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voicesLoadedRef = useRef<boolean>(false);
  const audioBlobsRef = useRef<Map<string, Blob>>(new Map());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handleRecordClickRef = useRef<() => Promise<void>>();

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);



  // ✅ useMemo for computed values
  const allQuestions = useMemo(() => {
    const questions: any[] = [];
    if (!question.questionGroup || question.questionGroup.length === 0) return questions;
    const sortedGroups = [...question.questionGroup].sort((a, b) => (a.order || 0) - (b.order || 0));
    sortedGroups.forEach((group, groupIndex) => {
      group.questions?.forEach((q, qIndex) => {
        questions.push({
          _id: q._id,
          question: q.question,
          options: q.options || [],
          explanation: q.explanation || "",
          groupId: group._id,
          groupTitle: group.title,
          groupOrder: group.order || groupIndex + 1,
          groupType: group.type || 'speaking_part_1',
          groupIndex: groupIndex,
          questionInGroupIndex: qIndex,
          isCueCard: group.type === 'speaking_part_2' ||
            group.title.toLowerCase().includes('cue') ||
            (group.instruction && group.instruction.toLowerCase().includes('you should say'))
        });
      });
    });
    return questions;
  }, [question.questionGroup]);

  const currentQuestion = useMemo(() =>
    allQuestions[currentQuestionIndex] || allQuestions[0] || null
    , [allQuestions, currentQuestionIndex]);

  const currentQuestionGroup = useMemo(() => {
    if (!currentQuestion || !question.questionGroup) return null;
    return question.questionGroup.find(group => group._id === currentQuestion.groupId);
  }, [currentQuestion, question.questionGroup]);

  const currentAnswer = useMemo(() =>
    answers.find(a => a.questionId === currentQuestion?._id)
    , [answers, currentQuestion]);

  const validAnsweredQuestions = useMemo(() =>
    answers.filter(a => a.audioUrl).length
    , [answers]);

  const totalQuestions = useMemo(() => allQuestions.length, [allQuestions]);

  const initialTimeRemaining = useMemo(() => {
    if (progress.sectionTimeRemaining !== undefined) {
      return progress.sectionTimeRemaining;
    }
    return question.timeLimit * 60;
  }, [progress.sectionTimeRemaining, question.timeLimit]);

  // ✅ useCallback for functions
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const drawVisualizer = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const centerY = canvas.height / 2;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyserRef.current!.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#3b82f6"; // blue line like image

      let x = 0;
      const sliceWidth = canvas.width / bufferLength;

      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] - 128) / 128; // normalize
        const y = centerY + v * centerY * 0.6; // subtle movement

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.stroke();
    };

    draw();
  }, []);


  const startVisualization = useCallback((stream: MediaStream) => {
    if (!canvasRef.current) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);

    analyser.fftSize = 1024; // smooth horizontal line
    analyser.smoothingTimeConstant = 0.9;

    microphone.connect(analyser);

    analyserRef.current = analyser;
    audioContextRef.current = audioContext;
    mediaStreamRef.current = stream;

    drawVisualizer();
  }, [drawVisualizer]);


  const stopVisualization = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (analyserRef.current && audioContextRef.current) {
      analyserRef.current.disconnect();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  const getAccurateDuration = useCallback((blob: Blob): Promise<number> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          resolve(Math.round(audioBuffer.duration));
          audioContext.close();
        } catch (err) {
          resolve(0);
        }
      };
      reader.onerror = () => resolve(0);
      reader.readAsArrayBuffer(blob);
    });
  }, []);

  const handleBack = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (isRecording) {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      stopVisualization();
      setIsRecording(false);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (audioTimerRef.current) {
      clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
    }

    if (autoRecordTimeoutRef.current) {
      clearTimeout(autoRecordTimeoutRef.current);
      autoRecordTimeoutRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    answers.forEach(answer => {
      if (answer.audioUrl) {
        URL.revokeObjectURL(answer.audioUrl);
      }
    });

    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio);
    }

    onBack();
  }, [isRecording, stopVisualization, answers, recordedAudio, onBack]);

  const stopAutoSpeak = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setAutoSpeaking(false);
    speechSynthesisRef.current = null;
  }, []);

  const startTTSFallback = useCallback(() => {
    if (!currentQuestion || !('speechSynthesis' in window)) {
      setRecordingStatus("Speech synthesis not available.");
      return;
    }

    window.speechSynthesis.cancel();
    stopAutoSpeak();
    setSpeechEnded(false);
    setUserManuallyStopped(false);
    setAutoSpeaking(true);
    setHasQuestionSpoken(false);

    const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1;

    utterance.onstart = () => {
      setRecordingStatus("Listening to question via TTS...");
    };

    utterance.onend = () => {
      setAutoSpeaking(false);
      setSpeechEnded(true);
      setHasQuestionSpoken(true);
      setRecordingStatus("Question spoken. Auto-recording in 1 second...");

      // Start recording automatically after 1 second
      setTimeout(() => {
        if (!currentQuestion || hasRecorded || isRecording) {
          return;
        }

        if (handleRecordClickRef.current) {
          handleRecordClickRef.current();
        }
      }, 1000);
    };

    utterance.onerror = (event) => {
      setAutoSpeaking(false);
      setHasQuestionSpoken(true);
      setRecordingStatus("Speech error. Click microphone to record manually.");
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const femaleVoices = voices.filter(voice => {
        const voiceName = voice.name.toLowerCase();
        return voice.lang.startsWith('en') && (
          voiceName.includes('female') || voiceName.includes('woman') ||
          voiceName.includes('samantha') || voiceName.includes('zira')
        );
      });
      if (femaleVoices.length > 0) {
        utterance.voice = femaleVoices[0];
      } else {
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) utterance.voice = englishVoice;
      }
    }

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [currentQuestion, hasRecorded, isRecording, stopAutoSpeak]);

  // Function to try playing video
  const tryPlayVideo = useCallback(async () => {
    if (!videoRef.current) return false;

    try {
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
      return true;
    } catch (error) {
      console.error("Video autoplay failed:", error);
      return false;
    }
  }, []);

  // Function to start video playback
  const startVideoPlayback = useCallback(async () => {
    if (!videoRef.current) return;

    setVideoLoading(true);
    setVideoError(false);
    setVideoEnded(false);
    setVideoPlayed(false);
    setHasQuestionSpoken(false);
    setAutoRecordTriggered(false);

    // Reset video
    videoRef.current.currentTime = 0;
    videoRef.current.muted = false;

    // Try to play with autoplay (muted)
    videoRef.current.muted = true;

    try {
      await videoRef.current.play();
      videoRef.current.muted = false;
      setVideoLoading(false);
      setRecordingStatus("Playing question video...");
    } catch (error) {
      // Autoplay with sound failed, try muted
      try {
        videoRef.current.muted = true;
        await videoRef.current.play();
        setVideoLoading(false);
        setRecordingStatus("Playing question video (muted)...");
      } catch (mutedError) {
        // Both failed, fallback to TTS
        setVideoError(true);
        setVideoLoading(false);
        startTTSFallback();
      }
    }
  }, [startTTSFallback]);

  const toggleQuestionSpeech = useCallback(() => {
    if (!currentQuestion) return;

    if (videoRef.current && !videoError) {
      // Toggle video play/pause
      if (!videoRef.current.paused) {
        videoRef.current.pause();
        setRecordingStatus("Video paused");
      } else {
        videoRef.current.play().catch(() => {
          // If video fails, use TTS
          startTTSFallback();
        });
      }
    } else if ('speechSynthesis' in window) {
      // Use TTS fallback
      if (window.speechSynthesis.speaking) {
        stopAutoSpeak();
        setRecordingStatus("Speech stopped");
      } else {
        startTTSFallback();
      }
    }
  }, [currentQuestion, videoError, stopAutoSpeak, startTTSFallback]);

  // Handle video play event
  const handleVideoPlay = useCallback(() => {
    setIsVideoPlaying(true);
    setRecordingStatus("Playing question video...");
  }, []);

  // Handle video pause event
  const handleVideoPause = useCallback(() => {
    setIsVideoPlaying(false);
    setRecordingStatus("Video paused");
  }, []);

  // Update handleVideoEnded:
  const handleVideoEnded = useCallback(() => {
    setIsVideoPlaying(false); // Add this line
    setVideoEnded(true);
    setVideoPlayed(true);
    setHasQuestionSpoken(true);
    setRecordingStatus("Video finished. Auto-recording in 1 second...");

    // Start recording automatically after 1 second
    setTimeout(() => {
      if (!currentQuestion || hasRecorded || isRecording || autoRecordTriggered) {
        return;
      }

      setAutoRecordTriggered(true);

      if (handleRecordClickRef.current) {
        handleRecordClickRef.current();
      }
    }, 1000);
  }, [currentQuestion, hasRecorded, isRecording, autoRecordTriggered]);

  // Update handleVideoError:
  const handleVideoError = useCallback(() => {
    setIsVideoPlaying(false); // Add this line
    setVideoError(true);
    setVideoLoading(false);

    // Fallback to TTS if video fails
    if (!hasQuestionSpoken && !autoSpeaking) {
      setTimeout(() => {
        startTTSFallback();
      }, 500);
    }
  }, [hasQuestionSpoken, autoSpeaking, startTTSFallback]);

  // Handle video loaded
  const handleVideoLoaded = useCallback(() => {
    setVideoLoading(false);
    setVideoError(false);

    // Try to play automatically when video is loaded
    if (!videoPlayed && !hasQuestionSpoken && !hasRecorded) {
      const playVideo = async () => {
        const played = await tryPlayVideo();
        if (!played) {
          // Fallback to TTS if video can't autoplay
          setTimeout(() => {
            startTTSFallback();
          }, 500);
        }
      };

      playVideo();
    }
  }, [videoPlayed, hasQuestionSpoken, hasRecorded, tryPlayVideo, startTTSFallback]);

  // Function to manually play video
  const playVideoManually = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        startTTSFallback();
      });
    }
  }, [startTTSFallback]);

  const startAudioRecording = useCallback((stream: MediaStream) => {
    try {
      const aacMimeType = 'audio/mp4;codecs=mp4a.40.2';
      const aacAlternative = 'audio/aac';

      let options: MediaRecorderOptions = {
        audioBitsPerSecond: 32000,
      };

      if (MediaRecorder.isTypeSupported(aacMimeType)) {
        options.mimeType = aacMimeType;
      } else if (MediaRecorder.isTypeSupported(aacAlternative)) {
        options.mimeType = aacAlternative;
      } else {
        const fallbackTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/ogg;codecs=opus',
          ''
        ];
        for (const mimeType of fallbackTypes) {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            if (mimeType) options.mimeType = mimeType;
            break;
          }
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const recordingStartTime = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          setRecordingStatus("Recording failed: No audio data");
          return;
        }

        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType || 'audio/mp4'
          });

          const recordingEndTime = Date.now();
          const accurateDuration = Math.round((recordingEndTime - recordingStartTime) / 1000);
          const finalDuration = Math.max(recordingTime, accurateDuration);

          if (currentQuestion) {
            audioBlobsRef.current.set(currentQuestion._id, audioBlob);
          }

          const audioUrl = URL.createObjectURL(audioBlob);

          setAnswers(prev => prev.map(answer => {
            if (answer.questionId === currentQuestion._id) {
              return {
                ...answer,
                audioBlob: audioBlob,
                audioUrl: audioUrl,
                duration: finalDuration,
              };
            }
            return answer;
          }));

          setRecordedAudio(audioUrl);
          setHasRecorded(true);
          setRecordingStatus(`Recording completed successfully ✓ (${formatTime(finalDuration)})`);

        } catch (error) {
          setRecordingStatus("Recording failed");
        }
      };

      mediaRecorder.start(100);

    } catch (err) {
      setRecordingStatus("Audio recording not supported");
    }
  }, [currentQuestion, recordingTime, formatTime]);

  const handleRecordClick = useCallback(async () => {
    if (!currentQuestion) return;

    if (hasRecorded && !isRecording) {
      setRecordingStatus("Recording already completed for this question");
      return;
    }

    if (isRecording) {
      setUserManuallyStopped(true);
      setRecordingStatus("Stopping recording...");

      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      stopVisualization();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      try {
        await onRecord("stop", currentQuestion._id);
      } catch (e) {
        // handle error
      }

    } else {
      setUserManuallyStopped(false);
      setRecordingStatus("Preparing to record...");
      audioChunksRef.current = [];
      setRecordedAudio("");
      setRecordingTime(0);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
            channelCount: 1
          }
        });

        mediaStreamRef.current = stream;

        const aacMimeType = 'audio/mp4;codecs=mp4a.40.2';
        const aacAlternative = 'audio/aac';

        let options: MediaRecorderOptions = {
          audioBitsPerSecond: 32000,
        };

        if (MediaRecorder.isTypeSupported(aacMimeType)) {
          options.mimeType = aacMimeType;
        } else if (MediaRecorder.isTypeSupported(aacAlternative)) {
          options.mimeType = aacAlternative;
        } else {
          const fallbackTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            ''
          ];
          for (const mimeType of fallbackTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
              if (mimeType) options.mimeType = mimeType;
              break;
            }
          }
        }

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        const recordingStartTime = Date.now();

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (audioChunksRef.current.length === 0) {
            setRecordingStatus("Recording failed: No audio data");
            return;
          }

          try {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: mediaRecorder.mimeType || 'audio/mp4'
            });

            const recordingEndTime = Date.now();
            const accurateDuration = Math.round((recordingEndTime - recordingStartTime) / 1000);
            const finalDuration = Math.max(recordingTime, accurateDuration);

            if (currentQuestion) {
              audioBlobsRef.current.set(currentQuestion._id, audioBlob);
            }

            const audioUrl = URL.createObjectURL(audioBlob);

            setAnswers(prev => prev.map(answer => {
              if (answer.questionId === currentQuestion._id) {
                return {
                  ...answer,
                  audioBlob: audioBlob,
                  audioUrl: audioUrl,
                  duration: finalDuration,
                };
              }
              return answer;
            }));

            setRecordedAudio(audioUrl);
            setHasRecorded(true);
            setRecordingStatus(`Recording completed ✓ (${formatTime(finalDuration)})`);

          } catch (error) {
            setRecordingStatus("Recording failed");
          }
        };

        mediaRecorder.start(100);

        startVisualization(stream);
        setIsRecording(true);
        setRecordingStatus(`${MAX_RECORDING_TIME / 60} minutes max`);

        const startTime = Date.now();

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        timerRef.current = setInterval(() => {
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          setRecordingTime(elapsedSeconds);

          if (elapsedSeconds >= MAX_RECORDING_TIME) {
            if (mediaRecorderRef.current?.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
            stopVisualization();
            setIsRecording(false);

            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }
        }, 1000);

        try {
          await onRecord("start", currentQuestion._id);
        } catch (e) {
          // handle error
        }

      } catch (err) {
        setRecordingStatus("Microphone access denied");
        setIsRecording(false);

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  }, [currentQuestion, hasRecorded, isRecording, stopVisualization, startVisualization, formatTime, onRecord, MAX_RECORDING_TIME]);

  useEffect(() => {
    handleRecordClickRef.current = handleRecordClick;
  }, [handleRecordClick]);

 const uploadAudioZip = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const validAnswers = answers.filter(a => a.audioUrl);
      
      if (validAnswers.length === 0) {
        setRecordingStatus("No recordings found to submit");
        return;
      }
      
      const files: { [name: string]: Uint8Array } = {};
      const fileInfo: Array<{
        name: string;
        duration: number;
        questionNum: number;
        questionId: string;
        questionText: string;
      }> = [];
      
      for (let i = 0; i < validAnswers.length; i++) {
        const ans = validAnswers[i];
        const q = allQuestions.find(q => q._id === ans.questionId);
        
        let audioBlob: Blob;
        
        if (audioBlobsRef.current.has(ans.questionId)) {
          audioBlob = audioBlobsRef.current.get(ans.questionId)!;
        } else if (ans.audioBlob) {
          audioBlob = ans.audioBlob;
        } else if (ans.audioUrl) {
          try {
            const response = await fetch(ans.audioUrl);
            audioBlob = await response.blob();
          } catch (error) {
          
            continue;
          }
        } else {
       
          continue;
        }
        
        const extension = audioBlob.type.includes('mp4') ? 'm4a' : 
                         audioBlob.type.includes('webm') ? 'webm' : 'wav';
        const filename = `question_${i+1}_${ans.questionId}.${extension}`;
        
        const arrayBuffer = await audioBlob.arrayBuffer();
        files[filename] = new Uint8Array(arrayBuffer);
        
        fileInfo.push({
          name: filename,
          duration: ans.duration || 0,
          questionNum: i + 1,
          questionId: ans.questionId,
          questionText: q?.question || ""
        });
      }
      
      const metadata = {
        testId: question._id,
        sectionId: question?.sectionId,
        testTitle: question.title,
        totalQuestions: allQuestions.length,
        recordedQuestions: validAnswers.length,
        files: fileInfo,
      };
      
      files['metadata.json'] = new TextEncoder().encode(JSON.stringify(metadata, null, 2));
      
    
      const zipped = zipSync(files, { level: 6, mtime: new Date() });
      const zipBlob = new Blob([zipped], { type: 'application/zip' });
      
      const formData = new FormData();
      formData.append('file', zipBlob, `speaking_test_${question.title.replace(/\s+/g, '_')}.zip`);
      
      const response = await api.post('/upload/iletsupload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 30000,
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded * 100) / e.total);
            setRecordingStatus(`Uploading ZIP: ${pct}%`);
          }
        }
      });
      
      const formattedAnswers = validAnswers.map(a => ({
        questionId: a.questionId,
        audioUrl: a.audioUrl || '',
        transcript: "",
        sectionId: sectionId,
        questionGroupId: a.questionGroupId,
        testId: question._id
      }));
      
      onSubmit(formattedAnswers);
      setRecordingStatus("Test submitted successfully!");
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      setRecordingStatus("Error uploading. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, allQuestions, question, sectionId, onSubmit]);


  const handleSubmitTest = useCallback(async () => {
    const recordedCount = answers.filter(a => a.audioUrl).length;

    if (recordedCount < allQuestions.length) {
      const missingIndices = answers
        .map((ans, idx) => !ans.audioUrl ? idx + 1 : null)
        .filter(idx => idx !== null);

      setRecordingStatus(
        `Please record all questions. ${recordedCount}/${allQuestions.length} recorded. ` +
        `Missing questions: ${missingIndices.join(', ')}`
      );
      return;
    }

    await uploadAudioZip();
  }, [answers, allQuestions, uploadAudioZip]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setRecordingTime(0);
      setIsRecording(false);
      setRecordedAudio("");
      setRecordingStatus("");
      setAutoSpeaking(false);
      setSpeechEnded(false);
      setUserManuallyStopped(false);
      setHasQuestionSpoken(false);
      setHasRecorded(false);
      setVideoPlayed(false);
      setVideoEnded(false);
      setVideoError(false);
      setIsVideoPlaying(false);
      setAutoRecordTriggered(false);
      stopAutoSpeak();
      stopVisualization();
      setPlaybackProgress(0);
      setPlaybackCurrentTime(0);
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      if (autoRecordTimeoutRef.current) clearTimeout(autoRecordTimeoutRef.current);
    } else {
      handleSubmitTest();
    }
  }, [currentQuestionIndex, allQuestions.length, stopAutoSpeak, stopVisualization, handleSubmitTest]);

  // ✅ useEffect hooks
  useEffect(() => {
    if (allQuestions.length > 0 && currentQuestionIndex >= allQuestions.length) {
      setCurrentQuestionIndex(0);
    }
  }, [allQuestions, currentQuestionIndex]);

  useEffect(() => {
    if (allQuestions.length > 0) {
      const initialAnswers: QuestionAnswer[] = allQuestions.map(q => ({
        questionId: q._id,
        audioBlob: null,
        audioUrl: null,
        transcript: "",
        duration: 0,
        questionGroupId: q.groupId,
        testId: question._id,
        sectionId: sectionId
      }));
      setAnswers(initialAnswers);
    }
  }, [allQuestions, sectionId, question._id]);

  useEffect(() => {
    if (sectionTimeRemaining > 0) {
      sectionTimerRef.current = setInterval(() => {
        setSectionTimeRemaining(prev => prev <= 1 ? 0 : prev - 1);
      }, 1000);
    }
    return () => {
      if (sectionTimerRef.current) clearInterval(sectionTimerRef.current);
    };
  }, [sectionTimeRemaining]);

  // ✅ Auto-start video when question changes
  useEffect(() => {
    if (currentQuestion && !hasRecorded && !hasQuestionSpoken) {
      const timer = setTimeout(() => {
        startVideoPlayback();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentQuestion, hasRecorded, hasQuestionSpoken, startVideoPlayback]);

  // ✅ Handle TTS when video fails
  useEffect(() => {
    if (videoError && !hasQuestionSpoken && !autoSpeaking && !hasRecorded) {
      const timer = setTimeout(() => {
        startTTSFallback();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [videoError, hasQuestionSpoken, autoSpeaking, hasRecorded, startTTSFallback]);

  useEffect(() => {
    if ('speechSynthesis' in window && !voicesLoadedRef.current) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) voicesLoadedRef.current = true;
      };
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
      return () => window.speechSynthesis.onvoiceschanged = null;
    }
  }, []);

  useEffect(() => {
    if (isRecording && !timerRef.current) {
      const startTime = Date.now();

      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(elapsedSeconds);

        if (elapsedSeconds >= MAX_RECORDING_TIME) {
          if (handleRecordClickRef.current) {
            handleRecordClickRef.current();
          }
        }
      }, 1000);
    } else if (!isRecording && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, MAX_RECORDING_TIME]);

  useEffect(() => {
    if (recordedAudio && currentQuestion) {
      setAnswers(prev => prev.map(answer => {
        if (answer.questionId === currentQuestion._id && !answer.audioUrl) {
          return {
            ...answer,
            audioUrl: recordedAudio,
            duration: recordingTime
          };
        }
        return answer;
      }));
    }
  }, [recordedAudio, currentQuestion, recordingTime]);

  useEffect(() => {
    if (speechEnded && !isRecording && !userManuallyStopped && !hasRecorded) {
      setRecordingStatus("Question spoken. Auto-recording in 1 second...");
    }
  }, [speechEnded, isRecording, userManuallyStopped, hasRecorded]);

  useEffect(() => {
    return () => {
      stopVisualization();
      stopAutoSpeak();
      if (audioRef.current) audioRef.current.pause();
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      }
      if (autoRecordTimeoutRef.current) clearTimeout(autoRecordTimeoutRef.current);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (audioTimerRef.current) {
        clearInterval(audioTimerRef.current);
        audioTimerRef.current = null;
      }
    };
  }, [stopVisualization, stopAutoSpeak]);

  if (!allQuestions || allQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-red-600">No questions available</h3>
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Go Back</button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f6]">
      <TestHeader
        title={question.title}
        currentSection={currentQuestionGroup?.title || "Speaking Section"}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        initialTimeRemaining={initialTimeRemaining}
        autoSpeaking={autoSpeaking}
        hasQuestionSpoken={hasQuestionSpoken}
        onBack={handleBack}
        formatTime={formatTime}
        onTimeUp={() => {
          handleSubmitTest();
        }}
      />

      <div className="max-w-6xl mx-auto ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Question with Video */}
          <div className="space-y-6">
            {currentQuestionGroup && (
              <div className=" p-6">
                <div className="flex items-start justify-between mb-4">

                </div>




                <div className="">

                  {/* Video Player with Fallback */}
                  <div className="relative  rounded-lg overflow-hidden">
                    {videoLoading && !videoError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="text-center">
                          <div className=" h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
                          <p className="text-gray-300 text-sm">Loading video...</p>
                        </div>
                      </div>
                    )}
                    <video
                      ref={videoRef}
                      src="/images/logo/tts-video.mp4"
                      className={`w-full h-auto max-h-64 ${videoLoading ? 'opacity-0' : 'opacity-100'}`}
                      autoPlay
                      playsInline
                      onLoadedData={handleVideoLoaded}
                      onError={handleVideoError}
                      onEnded={handleVideoEnded}
                      onPlay={handleVideoPlay}      // Add this
                      onPause={handleVideoPause}    // Add this
                    >
                      Your browser does not support the video tag.
                    </video>

                    {videoError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="text-center p-6">
                          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                          <p className="text-gray-300 mb-4">Video failed to load. Using TTS fallback...</p>
                          <button
                            onClick={startTTSFallback}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Play with TTS
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900  ml-30 mt-5 leading-relaxed">{currentQuestion.question}</h3>


                  {currentQuestion.isCueCard && question.cueCard?.prompts && question.cueCard.prompts.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold mb-3 text-gray-800 flex items-center">
                        <div className="mr-2 p-1 bg-gray-800 rounded"><CheckCircle className="h-3 w-3 text-white" /></div> You should say:
                      </h4>
                      <ul className="space-y-2">
                        {question.cueCard.prompts.map((prompt, index) => (
                          <li key={index} className="flex items-start group">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-800 text-white rounded-full text-xs leading-6 text-center mr-3 mt-0.5 group-hover:bg-gray-700 transition-colors">
                              {index + 1}
                            </span>
                            <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{prompt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            )}
            <div className="bg-white ml-80 w-lg  rounded-xl border border-gray-200 shadow-sm p-3">

              {/* Title */}
              <h3 className="text-center font-medium text-gray-900 mb-4">
                Recording in progress...
              </h3>

              {/* Waveform */}
              <div className="relative bg-white  rounded-xl p-4 mb-6">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={60}
                  className="w-full h-12"
                />

                {/* Mic Button (centered on waveform) */}
                <button
                  onClick={() => handleRecordClickRef.current?.() || handleRecordClick()}
                  disabled={
                    (hasRecorded && !isRecording) ||
                    autoSpeaking ||
                    videoLoading ||
                    isVideoPlaying ||  // Add this
                    (videoRef.current && !videoRef.current.paused) // Optional extra check
                  }
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
    w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition
    ${isRecording
                      ? 'bg-blue-600 animate-pulse'
                      : hasRecorded
                        ? 'bg-gray-300 cursor-not-allowed'
                        : autoSpeaking || videoLoading || isVideoPlaying
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  title={
                    isVideoPlaying ? "Cannot record while video is playing" :
                      videoLoading ? "Loading question video..." :
                        autoSpeaking ? "Cannot record while question is being spoken" :
                          hasRecorded && !isRecording
                            ? "Recording already completed"
                            : isRecording
                              ? "Stop recording"
                              : "Start recording"
                  }
                >
                  {isRecording ? (
                    <Square className="h-6 w-6" />
                  ) : hasRecorded ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : autoSpeaking || videoLoading || isVideoPlaying ? (
                    <Volume2 className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </button>
              </div>

              {/* Status text */}
              <p className="text-center text-sm text-gray-600 mb-4">
                {isRecording
                  ? `Recording... ${formatTime(MAX_RECORDING_TIME - recordingTime)} remaining`
                  : hasRecorded
                    ? 'Recording completed'
                    : autoSpeaking
                      ? 'Playing question...'
                      : videoLoading
                        ? 'Loading video...'
                        : 'Ready to record'}
              </p>



            </div>
          </div>


          {/* Right: Recording */}
          <div className="space-y-6">


            {/* Next / Submit */}
            <div className="ml-40 mt-25">
              <h1 className=" mb-4 text-2xl font-semibold text-gray-900">{question?.title}</h1>

              <button
                onClick={handleNextQuestion}
                disabled={!hasRecorded}
                className={`px-6 py-2 rounded-lg font-medium ${!hasRecorded
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : currentQuestionIndex < totalQuestions - 1
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
              >
                {currentQuestionIndex < totalQuestions - 1
                  ? 'Next Question'
                  : 'Submit'}
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default SpeakingTestSection;