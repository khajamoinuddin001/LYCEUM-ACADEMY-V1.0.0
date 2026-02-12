import React, { useState, useRef, useEffect } from 'react';
import { X, Video as VideoIcon, VideoOff, StopCircle } from '@/components/common/icons';

interface VideoRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blob: Blob) => void;
}

const VideoRecordingModal: React.FC<VideoRecordingModalProps> = ({ isOpen, onClose, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const setupStream = async () => {
    setError(null);
    setRecordedBlob(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.src = '';
      }
    } catch (err) {
      console.error("Error accessing media devices.", err);
      setError("Could not access camera and microphone. Please check permissions in your browser settings.");
    }
  };

  const cleanupStream = () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setupStream();
    } else {
      cleanupStream();
      setRecordedBlob(null);
      setIsRecording(false);
    }
  }, [isOpen]);

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const options = { mimeType: 'video/webm; codecs=vp9' };
    let recorder;
    try {
        recorder = new MediaRecorder(stream, options);
    } catch (e) {
        console.warn('webm/vp9 not supported, falling back.');
        recorder = new MediaRecorder(stream);
    }

    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'video/webm' });
      setRecordedBlob(blob);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        const videoUrl = URL.createObjectURL(blob);
        videoRef.current.src = videoUrl;
      }
    };
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    cleanupStream();
  };
  
  const handleSave = () => {
    if (recordedBlob) {
        onSave(recordedBlob);
        onClose();
    }
  };
  
  const handleDiscard = () => {
    if (recordedBlob && videoRef.current?.src) {
        URL.revokeObjectURL(videoRef.current.src);
    }
    setRecordedBlob(null);
    setupStream();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-[60] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Record Session</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"><X size={24} /></button>
        </div>
        <div className="p-6">
          <div className="w-full aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
            {error ? (
                <div className="text-red-500 p-4 text-center">
                    <VideoOff size={48} className="mx-auto mb-2" />
                    <p>{error}</p>
                </div>
            ) : (
                <video ref={videoRef} autoPlay muted={!recordedBlob} controls={!!recordedBlob} className="w-full h-full" />
            )}
          </div>
        </div>
        <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          {recordedBlob ? (
            <div className="flex items-center gap-4">
              <button onClick={handleDiscard} className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium">Discard & Re-record</button>
              <button onClick={handleSave} className="px-6 py-2 bg-lyceum-blue text-white rounded-md text-sm font-medium">Save Session</button>
            </div>
          ) : isRecording ? (
            <button onClick={stopRecording} className="flex items-center px-6 py-3 bg-red-600 text-white rounded-full text-lg font-semibold shadow-lg">
              <StopCircle size={24} className="mr-2" />
              Stop Recording
            </button>
          ) : (
            <button onClick={startRecording} disabled={!stream} className="flex items-center px-6 py-3 bg-lyceum-blue text-white rounded-full text-lg font-semibold shadow-lg disabled:bg-gray-400">
              <VideoIcon size={24} className="mr-2" />
              Start Recording
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoRecordingModal;
