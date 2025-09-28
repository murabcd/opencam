"use client";

import {
  Camera,
  Minimize,
  Play,
  RotateCcw,
  Square,
  Video,
  VideoOff,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect } from "react";
import { Greeting } from "@/components/greeting";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCamera } from "@/hooks/use-camera";

const MAX_ZOOM_LEVEL = 3;
const MIN_ZOOM_LEVEL = 1;

type VideoControlsProps = {
  isActive: boolean;
  disabled: boolean;
  isCapturing: boolean;
  isStreaming: boolean;
  zoomLevel: number;
  onToggleCamera: () => void;
  onCapture: () => void;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onSwitchCamera?: () => void;
  canSwitchCamera?: boolean;
};

function VideoControls({
  isActive,
  disabled,
  isCapturing,
  isStreaming,
  zoomLevel,
  onToggleCamera,
  onCapture,
  onStreamStart,
  onStreamStop,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onSwitchCamera,
  canSwitchCamera,
}: VideoControlsProps) {
  return (
    <div className="-translate-x-1/2 absolute bottom-4 left-1/2 transform">
      <div className="flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 backdrop-blur-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="h-10 w-10 rounded-full p-0"
              onClick={onToggleCamera}
              size="sm"
              variant={isActive ? "default" : "secondary"}
            >
              {isActive ? (
                <Video className="h-4 w-4" />
              ) : (
                <VideoOff className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isActive ? "Turn off camera" : "Turn on camera"}
          </TooltipContent>
        </Tooltip>

        {canSwitchCamera && onSwitchCamera && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-10 w-10 rounded-full p-0 sm:hidden"
                disabled={disabled}
                onClick={onSwitchCamera}
                size="sm"
                variant="secondary"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Switch camera</TooltipContent>
          </Tooltip>
        )}

        {/* Zoom Controls */}
        {onZoomOut && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-10 w-10 rounded-full p-0"
                disabled={zoomLevel <= MIN_ZOOM_LEVEL}
                onClick={onZoomOut}
                size="sm"
                variant="secondary"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>
        )}

        {onZoomReset && zoomLevel > MIN_ZOOM_LEVEL && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-10 w-10 rounded-full p-0"
                onClick={onZoomReset}
                size="sm"
                variant="secondary"
              >
                <Minimize className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset zoom ({zoomLevel}x)</TooltipContent>
          </Tooltip>
        )}

        {onZoomIn && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-10 w-10 rounded-full p-0"
                disabled={zoomLevel >= MAX_ZOOM_LEVEL}
                onClick={onZoomIn}
                size="sm"
                variant="secondary"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="h-10 w-10 rounded-full p-0"
              disabled={disabled || isCapturing}
              onClick={onCapture}
              size="sm"
              variant="default"
            >
              {isCapturing ? "..." : <Camera className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isCapturing ? "Capturing..." : "Take photo"}
          </TooltipContent>
        </Tooltip>

        {onStreamStart && onStreamStop && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-10 w-10 rounded-full p-0"
                disabled={disabled}
                onClick={isStreaming ? onStreamStop : onStreamStart}
                size="sm"
                variant={isStreaming ? "destructive" : "default"}
              >
                {isStreaming ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isStreaming ? "Stop streaming" : "Start streaming"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

type CameraCaptureProps = {
  onCapture: (dataUrl: string) => void | Promise<void>;
  onStreamStart?: () => void | Promise<void>;
  onStreamStop?: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  isStreaming?: boolean;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onVideoRef?: (ref: HTMLVideoElement | null) => void;
  onSwitchCamera?: () => void;
};

export function CameraCapture({
  onCapture,
  onStreamStart,
  onStreamStop,
  disabled = false,
  className = "",
  isStreaming = false,
  zoomLevel = 1,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onVideoRef,
  onSwitchCamera,
}: CameraCaptureProps) {
  const {
    videoRef,
    isActive,
    isCapturing,
    lastPhoto,
    error,
    start,
    stop,
    capture,
    switchCamera,
    canSwitchCamera,
  } = useCamera();

  const handleCapture = useCallback(async () => {
    try {
      const dataUrl = await capture();
      await onCapture(dataUrl);
    } catch {
      // Capture failed
    }
  }, [capture, onCapture]);

  const handleSwitchCamera = useCallback(async () => {
    try {
      await switchCamera();
      onSwitchCamera?.();
    } catch {
      // Switch failed
    }
  }, [switchCamera, onSwitchCamera]);

  // Pass video ref to parent component
  useEffect(() => {
    const video = videoRef.current;
    if (onVideoRef && video) {
      // Wait for video to be ready before passing ref
      const handleLoadedData = () => {
        onVideoRef(video);
      };

      if (video.readyState >= 2) {
        // Video already has enough data
        handleLoadedData();
      } else {
        // Wait for video to load
        video.addEventListener("loadeddata", handleLoadedData);
      }

      return () => {
        video.removeEventListener("loadeddata", handleLoadedData);
        if (onVideoRef) {
          onVideoRef(null);
        }
      };
    }
  }, [onVideoRef, videoRef]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-lg ${className}`}
    >
      {/* Video Stream */}
      <video
        autoPlay
        className={`h-full w-full rounded-lg object-cover transition-transform duration-300 ${
          isActive ? "block" : "hidden"
        }`}
        muted
        ref={videoRef}
        style={{
          transform: `scale(${zoomLevel})`,
        }}
      />

      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-4 rounded border border-destructive bg-destructive/10 px-2 py-1 text-destructive text-xs">
          {error}
        </div>
      )}

      {/* Streaming Status Badge */}
      {isActive && (
        <div className={`absolute top-4 ${error ? "right-4" : "left-4"}`}>
          <Badge
            className={
              isStreaming ? "bg-green-500 text-white" : "bg-gray-500 text-white"
            }
            variant="default"
          >
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  isStreaming ? "animate-pulse bg-white" : "bg-white"
                }`}
              />
              {isStreaming ? "Streaming" : "Streaming Off"}
            </div>
          </Badge>
        </div>
      )}

      {/* Camera Off State */}
      {!isActive && <Greeting disabled={disabled} onStart={start} />}

      {/* Video Controls Overlay */}
      {isActive && (
        <VideoControls
          canSwitchCamera={canSwitchCamera}
          disabled={disabled}
          isActive={isActive}
          isCapturing={isCapturing}
          isStreaming={isStreaming}
          onCapture={handleCapture}
          onStreamStart={onStreamStart}
          onStreamStop={onStreamStop}
          onSwitchCamera={handleSwitchCamera}
          onToggleCamera={isActive ? stop : start}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onZoomReset={onZoomReset}
          zoomLevel={zoomLevel}
        />
      )}

      {/* Last Photo Thumbnail */}
      {lastPhoto && (
        <div className="absolute top-4 right-4">
          <Image
            alt="Last captured frame"
            className="h-20 w-20 rounded-md border border-border bg-background object-cover shadow-md"
            height={80}
            src={lastPhoto}
            width={80}
          />
        </div>
      )}
    </div>
  );
}
