import { IMAGE_MAX_PX } from '../config';

/**
 * Resizes an image file so its long side is at most maxPx (default 768px).
 * Strips EXIF metadata by rendering through an HTML Canvas.
 * Returns base64 JPEG string and thumbnail base64 string.
 */
export async function processInputImage(
  file: File | Blob,
  maxPx: number = IMAGE_MAX_PX
): Promise<{
  fullBase64: string;
  mimeType: string;
  thumbnailBase64: string;
  hash: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image into canvas'));
      img.onload = () => {
        try {
          // 1. Calculate scaled dimensions for main image
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxPx || height > maxPx) {
            if (width > height) {
              height = Math.round((height * maxPx) / width);
              width = maxPx;
            } else {
              width = Math.round((width * maxPx) / height);
              height = maxPx;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context unavailable');
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);
          const fullDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64Data = fullDataUrl.split(',')[1] || '';

          // 2. Generate small 160px thumbnail for history
          const thumbMax = 160;
          let thumbW = img.naturalWidth;
          let thumbH = img.naturalHeight;
          if (thumbW > thumbH) {
            thumbH = Math.round((thumbH * thumbMax) / thumbW);
            thumbW = thumbMax;
          } else {
            thumbW = Math.round((thumbW * thumbMax) / thumbH);
            thumbH = thumbMax;
          }
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = thumbW;
          thumbCanvas.height = thumbH;
          const thumbCtx = thumbCanvas.getContext('2d');
          let thumbDataUrl = '';
          if (thumbCtx) {
            thumbCtx.drawImage(img, 0, 0, thumbW, thumbH);
            thumbDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.6);
          }

          // 3. Quick hash for cache lookup (DJB2 hash on base64 sample)
          let hash = 5381;
          const step = Math.max(1, Math.floor(base64Data.length / 500));
          for (let i = 0; i < base64Data.length; i += step) {
            hash = (hash * 33) ^ base64Data.charCodeAt(i);
          }
          const hashStr = `img_${Math.abs(hash)}_${base64Data.length}`;

          resolve({
            fullBase64: base64Data,
            mimeType: 'image/jpeg',
            thumbnailBase64: thumbDataUrl,
            hash: hashStr,
          });
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
