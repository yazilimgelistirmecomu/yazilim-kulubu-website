import { useEffect, useMemo } from "react";
import { Trash2, UploadCloud } from "lucide-react";
import { IMAGE_INPUT_ACCEPT } from "@/api/services/storage";

interface ImageFieldProps {
  label: string;
  /** Veritabanındaki mevcut görsel URL'si */
  currentUrl: string | null | undefined;
  /** Yeni seçilen (henüz yüklenmemiş) dosya */
  file: File | null;
  /** Kullanıcı mevcut görseli kaldırmak istedi (kayıtta null yazılır) */
  removed: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  variant?: "cover" | "avatar";
}

// Admin formlarındaki tek görsel alanı. Durum (file/removed) üst bileşende tutulur;
// bu bileşen props'ta gelen nesneleri asla değiştirmez.
export function ImageField({
  label,
  currentUrl,
  file,
  removed,
  onFileChange,
  onRemove,
  variant = "cover",
}: ImageFieldProps) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const shown = previewUrl || (removed ? null : currentUrl) || null;
  const isAvatar = variant === "avatar";

  return (
    <div className="space-y-1">
      <label className="text-sm font-bold text-primary">{label}</label>
      {shown ? (
        isAvatar ? (
          <div className="flex items-center gap-4">
            <img src={shown} alt={label} className="w-16 h-16 rounded-full object-cover border border-default" />
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-danger)] cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Fotoğrafı kaldır
            </button>
          </div>
        ) : (
          <div className="w-full relative h-40 border-2 border-default rounded-xl overflow-hidden bg-surface group">
            <img
              src={shown}
              alt={label}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity"
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 p-2 bg-[var(--color-danger-solid)] hover:bg-[var(--color-danger-hover)] text-white rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              title="Görseli Kaldır"
              aria-label="Görseli Kaldır"
            >
              <Trash2 className="w-4 h-4 pointer-events-none" />
            </button>
          </div>
        )
      ) : (
        <div className="w-full border-2 border-dashed border-default rounded-xl bg-page hover:bg-surface transition-colors">
          <label className="flex flex-col items-center justify-center p-6 cursor-pointer w-full gap-2">
            <UploadCloud className="w-8 h-8 text-[var(--brand-primary)] opacity-80" />
            <span className="text-sm font-bold text-primary">{isAvatar ? "Fotoğraf Seç" : "Görsel Seç"}</span>
            <span className="text-xs font-medium text-muted">PNG, JPG, WEBP veya HEIC/HEIF (Max 5MB)</span>
            <input type="file" accept={IMAGE_INPUT_ACCEPT} className="hidden" onChange={onFileChange} />
          </label>
        </div>
      )}
    </div>
  );
}
