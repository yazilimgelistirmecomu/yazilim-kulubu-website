import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from './Button';
import { ZoomIn, ZoomOut, Crop, X, Check } from 'lucide-react';
import { getCroppedImg } from '@/utils/cropImage';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  aspectRatio?: number; // Default aspect ratio (e.g. 16/9)
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 16 / 9
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [currentAspect, setCurrentAspect] = useState<number | undefined>(aspectRatio);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);

    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedFile);
      onClose();
    } catch (error) {
      console.error("Görsel kırpma hatası:", error);
      alert("Görsel kırpılırken hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="bg-page border border-default rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-default flex items-center justify-between bg-surface/50">
          <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
            <Crop className="w-5 h-5 text-[var(--brand-primary)]" /> Görseli Kırp ve Ölçeklendir
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-primary rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Viewport Area */}
        <div className="relative w-full h-[320px] sm:h-[400px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={currentAspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
          />
        </div>

        {/* Controls Bar */}
        <div className="p-4 sm:p-6 bg-surface/50 border-t border-default space-y-4">
          
          {/* Zoom Slider */}
          <div className="flex items-center gap-4 max-w-md mx-auto">
            <ZoomOut className="w-4 h-4 text-muted shrink-0" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-page rounded-lg appearance-none cursor-pointer accent-[var(--brand-primary)]"
            />
            <ZoomIn className="w-4 h-4 text-muted shrink-0" />
            <span className="text-xs font-mono text-muted w-10 text-right">{zoom.toFixed(1)}x</span>
          </div>

          {/* Aspect Ratio Options */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-semibold">
            <span className="text-muted mr-1">Oran:</span>
            <button
              type="button"
              onClick={() => setCurrentAspect(16 / 9)}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                currentAspect === 16 / 9
                  ? 'bg-[var(--brand-primary)] text-[var(--brand-text)] border-[var(--brand-primary)]'
                  : 'bg-page text-muted border-default hover:text-primary'
              }`}
            >
              16:9 (Kapak)
            </button>
            <button
              type="button"
              onClick={() => setCurrentAspect(4 / 3)}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                currentAspect === 4 / 3
                  ? 'bg-[var(--brand-primary)] text-[var(--brand-text)] border-[var(--brand-primary)]'
                  : 'bg-page text-muted border-default hover:text-primary'
              }`}
            >
              4:3 (Galeri)
            </button>
            <button
              type="button"
              onClick={() => setCurrentAspect(1 / 1)}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                currentAspect === 1 / 1
                  ? 'bg-[var(--brand-primary)] text-[var(--brand-text)] border-[var(--brand-primary)]'
                  : 'bg-page text-muted border-default hover:text-primary'
              }`}
            >
              1:1 (Kare)
            </button>
            <button
              type="button"
              onClick={() => setCurrentAspect(undefined)}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                currentAspect === undefined
                  ? 'bg-[var(--brand-primary)] text-[var(--brand-text)] border-[var(--brand-primary)]'
                  : 'bg-page text-muted border-default hover:text-primary'
              }`}
            >
              Serbest
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
              İptal
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={isProcessing} className="gap-2">
              <Check className="w-4 h-4" />
              {isProcessing ? 'Kırpılıyor...' : 'Kırp ve Onayla'}
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}
