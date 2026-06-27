/**
 * 图片压缩工具：将图片 dataURL 压缩到指定最大宽度并降低质量
 * @param {string} dataUrl - 原始图片 dataURL
 * @param {number} maxWidth - 最大宽度（像素）
 * @param {number} quality - JPEG 质量 0-1
 * @returns {Promise<string>} 压缩后的 dataURL
 */
export function compressImage(dataUrl, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * 将 dataURL 转为 Blob
 */
export function dataURLToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bytes = atob(parts[1]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}

/**
 * 获取当前季节：0=春, 1=夏, 2=秋, 3=冬
 */
export function getSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 0;
  if (m >= 6 && m <= 8) return 1;
  if (m >= 9 && m <= 11) return 2;
  return 3;
}

/**
 * 根据季节获取推荐浇水间隔（天）
 */
export function getWateringInterval() {
  const season = getSeason();
  if (season === 1) return { min: 5, max: 7 };
  if (season === 3) return { min: 10, max: 14 };
  return { min: 7, max: 10 };
}
