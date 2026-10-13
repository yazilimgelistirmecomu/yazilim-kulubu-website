import { supabase } from '../config';
import heic2any from 'heic2any';

export type AppImageBucket = 'project-images' | 'event-covers';

export const IMAGE_INPUT_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';
export const MAX_SOURCE_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_IMAGE_BYTES = 5 * 1024 * 1024;

type AcceptedSourceMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif';
type UploadMime = 'image/jpeg' | 'image/png' | 'image/webp';

const APP_IMAGE_BUCKETS = new Set<AppImageBucket>(['project-images', 'event-covers']);
const MIME_EXTENSIONS: Record<UploadMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function hasBytes(bytes: Uint8Array, offset: number, signature: number[]) {
  return signature.every((value, index) => bytes[offset + index] === value);
}

async function detectImageMime(file: File): Promise<AcceptedSourceMime | null> {
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());

  if (hasBytes(bytes, 0, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (hasBytes(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (hasBytes(bytes, 0, [0x52, 0x49, 0x46, 0x46]) && hasBytes(bytes, 8, [0x57, 0x45, 0x42, 0x50])) {
    return 'image/webp';
  }

  if (hasBytes(bytes, 4, [0x66, 0x74, 0x79, 0x70])) {
    const brand = new TextDecoder('ascii').decode(bytes.slice(8, 12)).toLowerCase();
    if (['heic', 'heix', 'hevc', 'hevx'].includes(brand)) return 'image/heic';
    if (['mif1', 'msf1'].includes(brand)) return 'image/heif';
  }

  return null;
}

async function validateImage(file: File, maxBytes: number) {
  if (file.size === 0) throw new Error('Boş dosya yüklenemez.');
  if (file.size > maxBytes) {
    throw new Error(`Görsel boyutu en fazla ${Math.floor(maxBytes / 1024 / 1024)} MB olabilir.`);
  }

  const detectedMime = await detectImageMime(file);
  if (!detectedMime) {
    throw new Error('Yalnızca gerçek JPEG, PNG, WebP veya HEIC/HEIF görselleri yüklenebilir.');
  }

  return detectedMime;
}

function validateFolder(path?: string) {
  if (!path) return;
  if (
    path.length > 100
    || path.startsWith('/')
    || path.includes('..')
    || path.includes('//')
    || !/^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(path)
  ) {
    throw new Error('Geçersiz yükleme klasörü.');
  }
}

export const storageService = {
  async processImage(file: File): Promise<File> {
    const detectedMime = await validateImage(file, MAX_SOURCE_IMAGE_BYTES);
    const isHeic = detectedMime === 'image/heic' || detectedMime === 'image/heif';

    if (!isHeic) return file;

    return new Promise<File>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
              resolve(new File([blob], newName, { type: 'image/jpeg' }));
              return;
            }
            this.fallbackHeic2Any(file).then(resolve).catch(reject);
          }, 'image/jpeg', 0.88);
          return;
        }
        this.fallbackHeic2Any(file).then(resolve).catch(reject);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        this.fallbackHeic2Any(file).then(resolve).catch(reject);
      };

      img.src = url;
    });
  },

  async fallbackHeic2Any(file: File): Promise<File> {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.88,
      });
      const resultBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      return new File([resultBlob], newFileName, { type: 'image/jpeg' });
    } catch (error) {
      console.error('HEIC dönüşüm hatası:', error);
      throw new Error('HEIC/HEIF görseli güvenli biçimde dönüştürülemedi.');
    }
  },

  async uploadImage(bucket: AppImageBucket, file: File, path?: string) {
    if (!APP_IMAGE_BUCKETS.has(bucket)) throw new Error('Geçersiz görsel deposu.');
    validateFolder(path);

    const processedFile = await this.processImage(file);
    const detectedMime = await validateImage(processedFile, MAX_UPLOAD_IMAGE_BYTES);

    if (!(detectedMime in MIME_EXTENSIONS)) {
      throw new Error('Görsel yükleme için JPEG, PNG veya WebP biçimine dönüştürülmelidir.');
    }

    const uploadMime = detectedMime as UploadMime;
    const fileName = `${crypto.randomUUID()}.${MIME_EXTENSIONS[uploadMime]}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, processedFile, {
        cacheControl: '3600',
        contentType: uploadMime,
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // Public URL -> { bucket, path }. Uygulamanın kendi bucket'ı değilse null.
  parsePublicUrl(url: string | null | undefined): { bucket: AppImageBucket; path: string } | null {
    if (!url) return null;
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/([^?#]+)/);
    if (!match) return null;
    const bucket = match[1] as AppImageBucket;
    if (!APP_IMAGE_BUCKETS.has(bucket)) return null;
    try {
      return { bucket, path: decodeURIComponent(match[2]) };
    } catch {
      return null;
    }
  },

  // Kayıt başarıyla kaydedildikten sonra çağrılır; hata kaydı engellemez, sadece loglanır.
  async deleteImagesByUrl(urls: Array<string | null | undefined>) {
    const targets = urls
      .map(url => this.parsePublicUrl(url))
      .filter((t): t is { bucket: AppImageBucket; path: string } => t !== null);

    await Promise.all(targets.map(async ({ bucket, path }) => {
      try {
        await this.deleteImage(bucket, path);
      } catch (error) {
        console.error('Storage dosyası silinemedi:', bucket, path, error);
      }
    }));
  },

  async deleteImage(bucket: AppImageBucket, path: string) {
    if (!APP_IMAGE_BUCKETS.has(bucket)) throw new Error('Geçersiz görsel deposu.');
    if (!path || path.startsWith('/') || path.includes('..')) throw new Error('Geçersiz dosya yolu.');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  },
};
