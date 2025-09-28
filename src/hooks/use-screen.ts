"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useScreenShare
 * - Starts/stops a screen share stream on a provided <video> element.
 * - Captures a frame as a JPEG data URL.
 * - Maintains last captured photo and basic state.
 * - Supports different screen share sources (screen, window, tab).
 */
export function useScreenShare() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareType, setShareType] = useState<"screen" | "window" | "tab">(
    "screen"
  );

  const stop = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const start = useCallback(async () => {
    if (isActive) {
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        throw new Error("Video element not ready.");
      }
      video.srcObject = stream;

      // Handle when user stops sharing via browser controls
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        stop();
      });

      // Ensure inline playback on iOS Safari
      (video as HTMLVideoElement & { playsInline?: boolean }).playsInline =
        true;

      // Autoplay
      await video.play().catch(async () => {
        // Wait for metadata before play on some browsers
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });
        await video.play();
      });
      setIsActive(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to start screen sharing"
      );
      stop();
    }
  }, [isActive, stop]);

  const capture = useCallback(() => {
    if (!videoRef.current) {
      throw new Error("Video element not ready");
    }
    if (!isActive) {
      throw new Error("Screen share not active");
    }
    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const targetWidth = 1920;
      const vw = video.videoWidth || targetWidth;
      const vh = video.videoHeight || targetWidth;
      const scale = targetWidth / vw;
      const width = targetWidth;
      const height = Math.max(1, Math.round(vh * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas 2D context not available");
      }
      ctx.drawImage(video, 0, 0, width, height);
      const JpegQuality = 0.92;
      const dataUrl = canvas.toDataURL("image/jpeg", JpegQuality);
      setLastPhoto(dataUrl);
      return dataUrl;
    } finally {
      setIsCapturing(false);
    }
  }, [isActive]);

  const switchShareType = useCallback(
    async (newType: "screen" | "window" | "tab") => {
      if (!isActive) {
        setShareType(newType);
        return;
      }

      setShareType(newType);
      // Stop current stream
      stop();

      // Start new stream with different share type
      try {
        let stream: MediaStream;

        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        });

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setIsActive(true);
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to switch share type"
        );
        // Revert share type on error
        setShareType(shareType);
      }
    },
    [isActive, shareType, stop]
  );

  useEffect(
    () => () => {
      stop();
    },
    [stop]
  );

  return {
    videoRef,
    isActive,
    isCapturing,
    lastPhoto,
    error,
    start,
    stop,
    capture,
    setLastPhoto,
    setError,
    shareType,
    switchShareType,
    canSwitchShareType: true,
  };
}

export type UseScreenShareReturn = ReturnType<typeof useScreenShare>;
