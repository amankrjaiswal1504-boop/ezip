import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadPhotos } from '../services/api';

// Uploads images (JPEG/PNG/WebP, 5 MB) and reports URLs. `capture` opens the
// phone camera directly (used for scale photos).
export default function PhotoUploader({ value = [], onChange, max = 6, folder = 'pickups', label = 'Add photos', capture, compact }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  async function onFiles(files) {
    const list = [...files].filter((f) => /image\/(jpeg|png|webp)/.test(f.type));
    if (!list.length) return toast.error('Choose JPEG, PNG or WebP images');
    if (list.some((f) => f.size > 5 * 1024 * 1024)) return toast.error('Each photo must be under 5 MB');
    setBusy(true);
    try {
      const urls = await uploadPhotos(list.slice(0, max - value.length), folder);
      onChange([...value, ...urls].slice(0, max));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {value.map((url) => (
        <div key={url} className={`relative rounded-lg overflow-hidden border border-steel-200 ${compact ? 'w-14 h-14' : 'w-20 h-20'}`}>
          <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
          <button
            type="button"
            onClick={() => onChange(value.filter((u) => u !== url))}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white inline-flex items-center justify-center"
            aria-label="Remove photo"
          >
            <X className="w-3 h-3" aria-hidden />
          </button>
        </div>
      ))}
      {value.length < max && (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className={`rounded-lg border-2 border-dashed border-steel-300 text-steel-500 hover:border-rust-500 hover:text-rust-600 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${compact ? 'w-14 h-14' : 'w-20 h-20'}`}
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <Camera className="w-5 h-5" aria-hidden />}
          {!compact && (busy ? 'Uploading' : label)}
          {compact && <span className="sr-only">{label}</span>}
        </button>
      )}
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={max - value.length > 1} capture={capture} className="hidden" onChange={(e) => onFiles(e.target.files)} />
    </div>
  );
}
