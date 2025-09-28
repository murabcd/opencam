"use client";

import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { CameraCapture } from "@/components/camera-capture";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { getToken } from "./server/session";

const agent = new RealtimeAgent({
  name: "Assistant",
  instructions: "You are a helpful assistant.",
});

export default function RealtimeVoiceApp() {
  const session = useRef<RealtimeSession | null>(null);
  const streamingInterval = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");

  useEffect(() => {
    session.current = new RealtimeSession(agent, {
      model: "gpt-realtime",
      config: {
        audio: {
          output: {
            voice: "cedar",
          },
        },
      },
    });
  }, []);

  const handleConnect = async () => {
    setConnectionStatus("connecting");
    try {
      const token = await getToken();
      await session.current?.connect({
        apiKey: token,
      });
      setIsConnected(true);
      setConnectionStatus("connected");
      // Ensure mic is always on when connecting
      setIsMicOn(true);
      await session.current?.mute(false);
    } catch {
      setConnectionStatus("disconnected");
    }
  };

  const handleDisconnect = async () => {
    await session.current?.close();
    setIsConnected(false);
    setIsMicOn(false);
    setZoomLevel(MinZoomLevel);
    setIsStreaming(false);
    if (streamingInterval.current) {
      clearInterval(streamingInterval.current);
      streamingInterval.current = null;
    }
    setConnectionStatus("disconnected");
  };

  const handleCaptureImage = (dataUrl: string) => {
    if (session.current && isConnected) {
      session.current.addImage(dataUrl, { triggerResponse: true });
    }
    // When not connected, the image is still captured and stored in the camera component
    // This allows testing of camera functionality without AI connection
  };

  const StreamingIntervalMs = 2000;
  const ImageQuality = 0.8;
  const VideoReadyDelayMs = 500;
  const MaxZoomLevel = 3;
  const MinZoomLevel = 1;
  const ZoomStep = 0.5;

  const captureVideoFrame = useCallback(() => {
    // Only check if we have video ref and session - the interval existence means we're streaming
    if (videoRef.current && session.current && streamingInterval.current) {
      const video = videoRef.current;

      // Check if video is actually playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", ImageQuality);
        session.current.addImage(dataUrl, { triggerResponse: false });
      }
    }
  }, []);

  const handleStreamStart = () => {
    if (session.current) {
      setIsStreaming(true);

      // Add a small delay to ensure video is ready, then start streaming
      setTimeout(() => {
        // Double-check streaming state and start interval
        if (videoRef.current && session.current) {
          streamingInterval.current = setInterval(
            captureVideoFrame,
            StreamingIntervalMs
          );

          // Capture first frame immediately
          captureVideoFrame();
        }
      }, VideoReadyDelayMs);
    }
  };

  const handleStreamStop = () => {
    if (session.current) {
      setIsStreaming(false);
      // Stop streaming video to the AI
      if (streamingInterval.current) {
        clearInterval(streamingInterval.current);
        streamingInterval.current = null;
      }
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + ZoomStep, MaxZoomLevel));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - ZoomStep, MinZoomLevel));
  };

  const handleZoomReset = () => {
    setZoomLevel(MinZoomLevel);
  };

  const handleMicToggle = async () => {
    if (session.current) {
      if (isMicOn) {
        // Mic is currently ON, so mute it
        await session.current.mute(true);
        setIsMicOn(false);
      } else {
        // Mic is currently OFF, so unmute it
        await session.current.mute(false);
        setIsMicOn(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <div className="h-4 w-4 rounded-sm bg-background" />
          </div>
          <h1 className="text-balance font-semibold text-xl">OpenCam</h1>
        </div>

        <div className="flex items-center gap-3">
          <ModeToggle />

          {/* Mic Toggle Button */}
          {isConnected && (
            <Button
              className="h-10 w-10 rounded-full p-0"
              onClick={handleMicToggle}
              size="sm"
              variant={isMicOn ? "default" : "secondary"}
            >
              {isMicOn ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </Button>
          )}

          {isConnected ? (
            <Button onClick={handleDisconnect} size="sm" variant="destructive">
              Disconnect
            </Button>
          ) : (
            <Button
              disabled={connectionStatus === "connecting"}
              onClick={handleConnect}
              size="sm"
            >
              {connectionStatus === "connecting" ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>
      </header>

      <div className="h-[calc(100vh-120px)]">
        {/* Main Camera Area */}

        <div className="flex h-full items-center justify-center">
          <CameraCapture
            className="w-full"
            disabled={false}
            isStreaming={isStreaming}
            onCapture={handleCaptureImage}
            onStreamStart={isConnected ? handleStreamStart : undefined}
            onStreamStop={isConnected ? handleStreamStop : undefined}
            onVideoRef={(ref) => {
              videoRef.current = ref;
            }}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomReset={handleZoomReset}
            onSwitchCamera={() => {
              // Camera switch is handled internally by the CameraCapture component
            }}
            zoomLevel={zoomLevel}
          />
        </div>
      </div>
    </div>
  );
}
