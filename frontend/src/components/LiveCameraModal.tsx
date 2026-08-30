import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, X, RefreshCw, Zap, AlertCircle } from 'lucide-react';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setCameraError(null);

    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : 'Could not access phone/webcam camera. Please check camera connection.'
      );
    } finally {
      setIsInitializing(false);
    }
  }, [facingMode, stream]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      startCamera();
    } else {
      document.body.style.overflow = '';
      stopStream();
    }
    return () => {
      document.body.style.overflow = '';
      stopStream();
    };
  }, [isOpen, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `label_scan_${Date.now()}.png`, {
          type: 'image/png',
        });
        stopStream();
        onCapture(file);
        onClose();
      }
    }, 'image/png');
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92dvh] bg-slate-900 border border-slate-700/90 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header Bar */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-400" />
              <span>Snap Nutrition Label</span>
            </h3>
          </div>
          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video Viewfinder Container */}
        <div className="relative bg-black w-full h-[50vh] sm:h-[400px] flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center max-w-md">
              <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
              <p className="text-sm text-slate-200 font-semibold mb-2">{cameraError}</p>
              <p className="text-xs text-slate-400 mb-4">
                You can still upload a photo of the nutrition label directly from your gallery.
              </p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Bounding Frame */}
              <div className="absolute inset-0 pointer-events-none border-2 sm:border-[3px] border-emerald-500/40 rounded-2xl m-4 sm:m-8 flex flex-col justify-between p-3 sm:p-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                {/* Target Corners */}
                <div className="flex justify-between">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                </div>
                {/* Center Scanning Line Animation */}
                <div className="relative w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse" />
                <div className="flex justify-between">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                </div>
              </div>

              {/* Overlay Prompt */}
              <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 bg-slate-950/85 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full border border-slate-700/60 text-[10px] sm:text-[11px] font-medium text-emerald-300 tracking-wide pointer-events-none whitespace-nowrap shadow-lg">
                Align FSSAI Nutrition Table inside frame
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls Footer */}
        <div className="p-3 sm:p-5 bg-slate-950/95 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={toggleCamera}
            disabled={!!cameraError}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors disabled:opacity-40"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">Flip</span>
          </button>

          <button
            onClick={handleCapture}
            disabled={!!cameraError || isInitializing}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/60 transition-all transform active:scale-95 disabled:opacity-50"
          >
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
            <span>CAPTURE & SCAN LABEL</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
