import React, { useEffect, useRef, useState } from 'react';
import { X, RefreshCw, AlertCircle, Camera } from 'lucide-react';
import { Language, i18n } from '../i18n';

interface CameraViewProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
  onFallback: () => void;
  language: Language;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onCapture,
  onClose,
  onFallback,
  language,
}) => {
  const t = i18n[language];
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Stop all camera tracks safely
  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
  };

  // Start media stream
  useEffect(() => {
    let isCancelled = false;

    const startCamera = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      stopTracks();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage(t.cameraUnavailable);
        setIsLoading(false);
        return;
      }

      try {
        // Enumerate video devices to see if multiple cameras are available
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === 'videoinput');
          if (!isCancelled) {
            setHasMultipleCameras(videoDevices.length > 1);
          }
        } catch {
          // Non-fatal if enumerateDevices fails
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setIsLoading(false);
      } catch (err: unknown) {
        console.warn('getUserMedia error:', err);
        if (!isCancelled) {
          setErrorMessage(t.cameraUnavailable);
          setIsLoading(false);
        }
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      stopTracks();
    };
  }, [facingMode, language]);

  // Capture frame to canvas and export as Blob
  const handleShutter = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          stopTracks();
          if (blob) {
            onCapture(blob);
          } else {
            onClose();
          }
        },
        'image/jpeg',
        0.9
      );
    } catch (err) {
      console.error('Frame capture failed:', err);
      stopTracks();
      onClose();
    }
  };

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleClose = () => {
    stopTracks();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      {/* Top Bar: Close (X) button top-left */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between p-3.5 sm:p-5 bg-gradient-to-b from-black/60 to-transparent">
        <button
          type="button"
          onClick={handleClose}
          className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xs transition hover:bg-black/60 active:scale-95 cursor-pointer"
          aria-label={t.closeCamera}
        >
          <X className="h-6 w-6 stroke-[2]" />
        </button>

        {hasMultipleCameras && !errorMessage && (
          <button
            type="button"
            onClick={handleToggleFacingMode}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xs transition hover:bg-black/60 active:scale-95 cursor-pointer"
            aria-label={t.switchCamera}
          >
            <RefreshCw className="h-5 w-5 stroke-[2]" />
          </button>
        )}
      </div>

      {/* Video Viewport / Error State */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
        {errorMessage ? (
          <div className="mx-4 max-w-sm w-full rounded-2xl border border-white/10 bg-neutral-900/90 p-5 sm:p-6 text-center shadow-xl">
            <AlertCircle className="mx-auto h-9 w-9 text-amber-400" />
            <p className="mt-3 text-sm font-medium text-white">{errorMessage}</p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  stopTracks();
                  onFallback();
                }}
                className="w-full rounded-xl bg-[#2F3E46] py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#3d4f59] active:scale-95 min-h-[44px] cursor-pointer"
              >
                {t.chooseFromGallery}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-xl border border-white/20 bg-transparent py-2.5 text-xs sm:text-sm font-medium text-neutral-300 hover:bg-white/5 min-h-[44px] cursor-pointer"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="h-full w-full object-cover"
            />

            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span className="mt-3 text-xs text-neutral-300">Starting camera...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Shutter Controls */}
      {!errorMessage && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center pb-8 pt-4 bg-gradient-to-t from-black/70 to-transparent">
          <button
            type="button"
            onClick={handleShutter}
            disabled={isLoading}
            className="group relative flex h-20 w-20 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-4 border-white transition active:scale-90 disabled:opacity-50 cursor-pointer"
            aria-label={t.capturePhoto}
          >
            {/* Inner Shutter Circle */}
            <div className="h-14 w-14 rounded-full bg-white transition-transform group-hover:scale-95" />
          </button>
        </div>
      )}
    </div>
  );
};
