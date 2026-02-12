import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera as CameraIcon, CheckCircle2, RefreshCw } from '@/components/common/icons';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startStream = useCallback(async () => {
    stopStream();
    setCapturedImage(null);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera.", err);
      setError("Could not access camera. Please check permissions in your browser settings.");
    }
  }, [stopStream]);

  useEffect(() => {
    if (isOpen) {
      startStream();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startStream, stopStream]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopStream();
      }
    }
  };

  const handleRetake = () => {
    startStream();
  };

  const handleUsePhoto = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          onCapture(blob);
        }
      }, 'image/jpeg');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-[60] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Take Photo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"><X size={24} /></button>
        </div>
        <div className="p-6">
          <div className="w-full aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
            {error ? (
                <div className="text-red-500 p-4 text-center">
                    <CameraIcon size={48} className="mx-auto mb-2" />
                    <p>{error}</p>
                </div>
            ) : capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
            ) : (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>
        <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          {capturedImage ? (
            <div className="flex items-center gap-4">
              <button onClick={handleRetake} className="flex items-center px-6 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium">
                <RefreshCw size={16} className="mr-2" />
                Retake
              </button>
              <button onClick={handleUsePhoto} className="flex items-center px-6 py-2 bg-lyceum-blue text-white rounded-md text-sm font-medium">
                <CheckCircle2 size={16} className="mr-2" />
                Use Photo
              </button>
            </div>
          ) : (
            <button onClick={handleCapture} disabled={!stream} className="flex items-center p-4 bg-lyceum-blue text-white rounded-full text-lg font-semibold shadow-lg disabled:bg-gray-400">
              <CameraIcon size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
