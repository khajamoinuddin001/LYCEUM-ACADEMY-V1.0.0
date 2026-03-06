import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, RefreshCw } from 'lucide-react';

interface SelfieCheckinProps {
    onCapture: (base64: string) => void;
    onClose: () => void;
}

const SelfieCheckin: React.FC<SelfieCheckinProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        setLoading(true);
        setError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setLoading(false);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Unable to access camera. Please ensure permissions are granted.");
            setLoading(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                // Draw the video frame to the canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImage(dataUrl);
                stopCamera();
            }
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        startCamera();
    };

    const submitPhoto = () => {
        if (capturedImage) {
            onCapture(capturedImage);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-600" />
                        Selfie Verification
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="relative aspect-video bg-black flex items-center justify-center">
                    {loading && !error && (
                        <div className="flex flex-col items-center gap-3">
                            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                            <span className="text-white text-sm">Initializing camera...</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-6 text-center">
                            <p className="text-red-400 mb-4">{error}</p>
                            <button
                                onClick={startCamera}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {!capturedImage ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className={`w-full h-full object-cover ${loading ? 'hidden' : 'block'}`}
                        />
                    ) : (
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-full h-full object-cover"
                        />
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="p-6 bg-white">
                    {!capturedImage ? (
                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-6">
                                Please look at the camera and ensure your face is clearly visible.
                            </p>
                            <button
                                disabled={loading || !!error}
                                onClick={capturePhoto}
                                className="w-20 h-20 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-all mx-auto border-4 border-white ring-4 ring-blue-100"
                            >
                                <Camera className="w-10 h-10 text-white" />
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={retakePhoto}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Retake
                            </button>
                            <button
                                onClick={submitPhoto}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-700 shadow-md transform active:scale-95 transition-all"
                            >
                                <Check className="w-5 h-5" />
                                Verify & In
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SelfieCheckin;
