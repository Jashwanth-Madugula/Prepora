"use client";


/**
 * @file src/components/interview/audio-recorder.tsx
 * @category React UI Component
 *
 * Why this code exists:
 * Renders a visual UI element or widget inside the candidate's application view.
 * 
 *
 * What problem it solves:
 * - Constructs modular, interactive interface components (like forms, buttons, timers, code-editors) keeping state reactive and responsive to candidate interactions.
 *
 * How it works internally:
 * - Implements a TypeScript React function component combining Tailwind CSS styling, React hooks (useState, useEffect, useMemo), animations (framer-motion), and callback events.
 */

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, RotateCcw, Trash2 } from "lucide-react";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob | null, duration?: number) => void;
}

/**
 * AudioRecorder Component
 * Renders a glassmorphic mic controller that wraps the browser MediaRecorder API.
 * Supports:
 * - Start/Stop recording with visual pulse waves
 * - Recording elapsed timer display
 * - Playback audio preview of the recorded clip
 * - Re-record/Reset options
 *
 * FLOW:
 * 1. User clicks "Start Recording", browser prompts for microphone permissions.
 * 2. MediaRecorder saves audio data chunks as they stream.
 * 3. User stops recording. Chunks are compiled into a single WebM audio Blob.
 * 4. Blob is stored locally and exposed via `onRecordingComplete` callback.
 * 5. Users can preview their voice or wipe the recording to start over.
 */
export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [permission, setPermission] = useState<boolean | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "stopped">("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimestampRef = useRef<number>(0);

  // Synchronize recording timer
  useEffect(() => {
    if (recordingStatus === "recording") {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingStatus]);

  // Request mic access and start recording
  const startRecording = async () => {
    setAudioChunks([]);
    setAudioUrl(null);
    onRecordingComplete(null, 0);
    setRecordingTime(0);
    recordingStartTimestampRef.current = Date.now();

    if ("MediaRecorder" in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setPermission(true);
        setStream(streamData);

        const media = new MediaRecorder(streamData, { mimeType: "audio/webm" });
        mediaRecorderRef.current = media;
        
        let localChunks: Blob[] = [];
        media.ondataavailable = (event) => {
          if (typeof event.data === "undefined") return;
          if (event.data.size === 0) return;
          localChunks.push(event.data);
        };

        media.onstop = () => {
          const duration = Math.round((Date.now() - recordingStartTimestampRef.current) / 1000);
          const audioBlob = new Blob(localChunks, { type: "audio/webm" });
          const audioUrlData = URL.createObjectURL(audioBlob);
          setAudioUrl(audioUrlData);
          setAudioChunks([]);
          onRecordingComplete(audioBlob, duration);
        };

        media.start(250); // Emit chunk every 250ms
        setRecordingStatus("recording");
      } catch (err) {
        console.error("Microphone Access Error:", err);
        setPermission(false);
        alert("Failed to access microphone. Please check system permissions.");
      }
    } else {
      alert("Your browser does not support the MediaRecorder API.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === "recording") {
      mediaRecorderRef.current.stop();
      setRecordingStatus("stopped");
      
      // Stop all tracks to release hardware lights
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setStream(null);
    }
  };

  // Reset recorder
  const resetRecorder = () => {
    stopRecording();
    setRecordingStatus("idle");
    setAudioUrl(null);
    setAudioChunks([]);
    setRecordingTime(0);
    setIsPlaying(false);
    onRecordingComplete(null, 0);
  };

  // Toggle audio playback preview
  const togglePlayPreview = () => {
    if (audioPlayerRef.current && audioUrl) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 shadow-sm backdrop-blur-md">
      {/* Audio element for local playback */}
      {audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      <div className="flex flex-col items-center space-y-2">
        <h4 className="text-sm font-bold tracking-tight text-zinc-700 dark:text-zinc-300">
          Voice Answer Recording
        </h4>
        <p className="text-xs text-zinc-400">
          {recordingStatus === "idle" && "Click the microphone to start speaking"}
          {recordingStatus === "recording" && "Recording live... Speak clearly."}
          {recordingStatus === "stopped" && "Listen to your preview below or submit"}
        </p>
      </div>

      {/* Main Pulse Recording Indicator */}
      <div className="relative flex items-center justify-center w-28 h-28 my-2">
        {recordingStatus === "recording" && (
          <>
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500/20 animate-ping" />
            <span className="absolute inline-flex h-24 w-24 rounded-full bg-rose-500/10 animate-pulse" />
          </>
        )}
        
        <button
          onClick={recordingStatus === "recording" ? stopRecording : startRecording}
          type="button"
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
            recordingStatus === "recording"
              ? "bg-rose-500 hover:bg-rose-600 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {recordingStatus === "recording" ? (
            <Square className="w-8 h-8 fill-current" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>
      </div>

      {/* Timer or playback indicator */}
      <div className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200">
        {recordingStatus === "recording" ? (
          <span className="text-rose-500 animate-pulse">● {formatTime(recordingTime)}</span>
        ) : audioUrl ? (
          <span className="text-zinc-550 dark:text-zinc-400">Recorded: {formatTime(recordingTime)}</span>
        ) : (
          <span className="text-zinc-350 dark:text-zinc-650">00:00</span>
        )}
      </div>

      {/* Playback & Reset buttons */}
      {audioUrl && (
        <div className="flex items-center gap-3 w-full max-w-xs pt-2">
          <button
            onClick={togglePlayPreview}
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Play Preview
              </>
            )}
          </button>
          
          <button
            onClick={resetRecorder}
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-rose-200 dark:border-rose-900/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold transition"
          >
            <RotateCcw className="w-4 h-4" />
            Re-record
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * FILE PURPOSE & HELP:
 * This component sets up the mic interface for Audio interviews.
 * - Prompts navigator.mediaDevices.getUserMedia for voice streams.
 * - Accumulates byte stream in browser memory.
 * - Saves complete data inside an HTML5 blob.
 * - Exposes the blob to parent submit routines for Cloudinary transfer.
 */
