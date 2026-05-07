import { useEffect, useRef, useState } from 'react';
import { X, Camera, Lightbulb } from 'lucide-react';

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.82;

export default function CameraGuideModal({ step, onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera not available in this browser.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => { /* autoplay blocked */ });
            setReady(true);
          };
        }
      } catch (err) {
        setError(err?.message || 'Could not access the camera.');
      }
    };
    start();
    return () => {
      cancelled = true;
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(vw, vh));
    const w = Math.round(vw * scale);
    const h = Math.round(vh * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    onCapture?.(dataUrl);
  };

  return (
    <div className="symptom-log__camera-modal" role="dialog" aria-modal="true">
      <div className="symptom-log__camera-backdrop" onClick={onClose} />
      <div className="symptom-log__camera-sheet">
        <button
          type="button"
          className="symptom-log__camera-close"
          aria-label="Close camera"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <div className="symptom-log__camera-stage">
          {error ? (
            <p className="symptom-log__camera-error">{error}</p>
          ) : (
            <video
              ref={videoRef}
              className="symptom-log__camera-video"
              playsInline
              muted
            />
          )}
          {step?.title && (
            <div className="symptom-log__camera-overlay">
              <p className="symptom-log__camera-step-title">{step.title}</p>
              {step.tip && (
                <p className="symptom-log__camera-step-tip">
                  <Lightbulb size={12} />
                  <span>{step.tip}</span>
                </p>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="symptom-log__camera-capture"
          disabled={!ready || !!error}
          onClick={capture}
          aria-label="Capture photo"
        >
          <Camera size={18} />
          <span>Capture</span>
        </button>
      </div>
    </div>
  );
}
