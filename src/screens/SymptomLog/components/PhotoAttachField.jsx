import { useRef } from 'react';
import { Camera, X } from 'lucide-react';

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.82;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function downsize(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function PhotoAttachButton({ onAdd }) {
  const inputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    for (const file of files) {
      try {
        const raw = await fileToDataUrl(file);
        const dataUrl = await downsize(raw);
        onAdd?.({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          dataUrl,
          name: file.name || '',
        });
      } catch {
        /* skip unreadable file */
      }
    }
  };

  return (
    <>
      <button
        type="button"
        className="symptom-log__icon-btn"
        title="Attach a photo"
        aria-label="Attach a photo"
        onClick={() => inputRef.current?.click()}
      >
        <Camera size={16} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFiles}
        style={{ display: 'none' }}
      />
    </>
  );
}

export function PhotoThumbStrip({ photos = [], onRemove }) {
  if (!photos.length) return null;
  return (
    <div className="symptom-log__photos">
      {photos.map((p) => (
        <div key={p.id} className="symptom-log__photo-thumb">
          <img src={p.dataUrl} alt={p.name || 'attachment'} />
          <button
            type="button"
            className="symptom-log__photo-remove"
            aria-label="Remove photo"
            onClick={() => onRemove?.(p.id)}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default PhotoAttachButton;
