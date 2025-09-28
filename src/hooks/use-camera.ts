"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const mobileBreakpoint = 768;
const mobileUserAgentRegex = /Android|iPhone|iPad|iPod/i;

/**
 * useCamera
 * - Starts/stops a webcam stream on a provided <video> element.
 * - Captures a frame as a JPEG data URL.
 * - Maintains last captured photo and basic state.
 * - Supports switching between front and back cameras on mobile.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>(
    []
  );

  // Enumerate available devices
  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setAvailableDevices(videoDevices);
    } catch {
      // Silently handle device enumeration failure
      setAvailableDevices([]);
    }
  }, []);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        throw new Error("Video element not ready.");
      }
      video.srcObject = stream;
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
      setError(e instanceof Error ? e.message : "Failed to start camera");
      stop();
    }
  }, [isActive, stop, facingMode]);
  const capture = useCallback(() => {
    if (!videoRef.current) {
      throw new Error("Video element not ready");
    }
    if (!isActive) {
      throw new Error("Camera not active");
    }
    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const targetWidth = 800;
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

  const switchCamera = useCallback(async () => {
    if (!isActive) {
      return;
    }

    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);

    // Stop current stream
    stop();

    // Start new stream with different camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
        setIsActive(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to switch camera");
      // Revert facing mode on error
      setFacingMode(facingMode);
    }
  }, [isActive, facingMode, stop]);

  useEffect(() => {
    enumerateDevices();
  }, [enumerateDevices]);

  useEffect(
    () => () => {
      stop();
    },
    [stop]
  );

  // On mobile devices, assume multiple cameras are available if we can't enumerate them
  const isMobile =
    typeof window !== "undefined" &&
    (mobileUserAgentRegex.test(navigator.userAgent) ||
      window.innerWidth < mobileBreakpoint);

  // On mobile, assume multiple cameras exist even if we can only detect one
  // iOS Safari heavily restricts device enumeration for privacy
  const hasMultipleCameras = availableDevices.length > 1 || isMobile;

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
    switchCamera,
    facingMode,
    availableDevices,
    canSwitchCamera: hasMultipleCameras,
  };
}
export type UseCameraReturn = ReturnType<typeof useCamera>;
