"use client";

import React, { useState, useRef, useEffect } from "react";
import { Video, Square, Play, Pause, RotateCcw } from "lucide-react";

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob | null, duration?: number) => void;
}

/**
 * VideoRecorder Component
 * Manages video recording using HTML5 camera stream and browser MediaRecorder API.
 * Supports:
 * - Live webcam stream preview in HTML5 video element
 * - Audio & video synchronous recording
 * - Recording elapsed timer display
 * - Playback preview mode with stop controls
 * - Reset and re-record capabilities
 *
 * FLOW:
 * 1. Component mounts: starts the webcam stream via navigator.mediaDevices.getUserMedia
 *    so the user has a visual webcam preview from day one.
 * 2. User clicks "Start Recording": starts recording the media stream.
 * 3. User clicks "Stop Recording": stops recording, compiles byte chunks into a WebM video Blob,
 *    and stops camera stream tracks (turning off the camera light).
 * 4. Local video playback loads the Blob for candidate self-review.
 * 5. Blob is exposed via `onRecordingComplete` callback to submit to Cloudinary.
 */
export default function VideoRecorder({ onRecordingComplete }: VideoRecorderProps) {
  const [permission, setPermission] = useState<boolean | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "stopped">("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimestampRef = useRef<number>(0);

  // Initialize camera preview stream on mount
  useEffect(() => {
    startCameraPreview();
    return () => {
      stopCameraStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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

  // Request media access and start live preview
  const startCameraPreview = async () => {
    try {
      const streamData = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      setPermission(true);
      setStream(streamData);
      
      // Feed live camera stream to preview element
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = streamData;
      }
    } catch (err) {
      console.error("Camera Access Error:", err);
      setPermission(false);
    }
  };

  // Close stream tracks
  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Start recording the stream
  const startRecording = async () => {
    setVideoUrl(null);
    onRecordingComplete(null, 0);
    setRecordingTime(0);
    recordingStartTimestampRef.current = Date.now();

    // Make sure stream is running
    let activeStream = stream;
    if (!activeStream) {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { facingMode: "user" },
        });
        setStream(activeStream);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = activeStream;
        }
      } catch (err) {
        console.error("Camera Access Error during record start:", err);
        alert("Failed to start camera. Please check camera permissions.");
        return;
      }
    }

    if (activeStream && "MediaRecorder" in window) {
      try {
        // Resolve supported codecs
        let options = { mimeType: "video/webm;codecs=vp8,opus" };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: "video/webm" };
        }

        const media = new MediaRecorder(activeStream, options);
        mediaRecorderRef.current = media;
        
        let localChunks: Blob[] = [];
        media.ondataavailable = (event) => {
          if (typeof event.data === "undefined") return;
          if (event.data.size === 0) return;
          localChunks.push(event.data);
        };

        media.onstop = () => {
          const duration = Math.round((Date.now() - recordingStartTimestampRef.current) / 1000);
          const videoBlob = new Blob(localChunks, { type: "video/webm" });
          const videoUrlData = URL.createObjectURL(videoBlob);
          setVideoUrl(videoUrlData);
          setRecordingStatus("stopped");
          onRecordingComplete(videoBlob, duration);
          
          // Release original preview tracks so the camera green light goes off
          stopCameraStream();
        };

        media.start(250); // emit chunk every 250ms
        setRecordingStatus("recording");
      } catch (err) {
        console.error("Failed to initialize MediaRecorder:", err);
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  // Reset and restart camera preview
  const resetRecorder = () => {
    stopRecording();
    setVideoUrl(null);
    setRecordingStatus("idle");
    setRecordingTime(0);
    setIsPlaying(false);
    onRecordingComplete(null, 0);
    startCameraPreview();
  };

  // Toggle video preview playback
  const togglePlayPreview = () => {
    if (videoPlayerRef.current && videoUrl) {
      if (isPlaying) {
        videoPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        videoPlayerRef.current.play();
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
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-5 flex flex-col items-center shadow-sm backdrop-blur-md">
      <div className="flex flex-col items-center text-center space-y-1 mb-4">
        <h4 className="text-sm font-bold tracking-tight text-zinc-700 dark:text-zinc-300">
          Video & Audio Interview Recording
        </h4>
        <p className="text-xs text-zinc-400">
          {recordingStatus === "idle" && "Check your frame and click start when ready"}
          {recordingStatus === "recording" && "Recording video... Maintain eye contact."}
          {recordingStatus === "stopped" && "Preview your recorded session or re-record"}
        </p>
      </div>

      {/* Video Screen Container */}
      <div className="relative w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden shadow-inner border border-zinc-250 dark:border-zinc-850 flex items-center justify-center">
        {/* Live Camera Stream (Active during Idle and Recording) */}
        {recordingStatus !== "stopped" && (
          <video
            ref={videoPreviewRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]" // mirror webcam view for better user experience
          />
        )}

        {/* Video Player (Loaded on Stopped to preview recording) */}
        {recordingStatus === "stopped" && videoUrl && (
          <video
            ref={videoPlayerRef}
            src={videoUrl}
            playsInline
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-cover"
          />
        )}

        {/* Permission warning overlays */}
        {permission === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-zinc-300 text-xs">
            <Video className="w-8 h-8 text-rose-500 mb-2" />
            <p className="font-semibold text-rose-500">Camera / Mic Access Denied</p>
            <p className="mt-1 opacity-75">Please enable camera and audio devices in your browser permissions to proceed.</p>
          </div>
        )}

        {/* Live REC indicators */}
        {recordingStatus === "recording" && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-rose-600/90 text-white text-[10px] font-black tracking-wider uppercase rounded-full animate-pulse z-20">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            REC {formatTime(recordingTime)}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 items-center justify-center mt-5 w-full max-w-sm">
        {recordingStatus === "idle" && (
          <button
            onClick={startRecording}
            type="button"
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow transition cursor-pointer"
          >
            <Video className="w-4 h-4" />
            Start Video Recording
          </button>
        )}

        {recordingStatus === "recording" && (
          <button
            onClick={stopRecording}
            type="button"
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow transition cursor-pointer animate-pulse"
          >
            <Square className="w-4 h-4 fill-current" />
            Stop Recording
          </button>
        )}

        {recordingStatus === "stopped" && (
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={togglePlayPreview}
              type="button"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition"
            >
              {isPlaying ? "Pause Preview" : "Play Preview"}
            </button>
            
            <button
              onClick={resetRecorder}
              type="button"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-250 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-record
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * FILE PURPOSE & HELP:
 * This component sets up the combined audio/video webcam recorder.
 * - Spawns camera/mic stream using getUserMedia.
 * - Renders a mirrored camera panel.
 * - Streams chunks to browser RAM during active recording.
 * - On stop, compiles the stream to WebM and exposes the Blob.
 */
