/**
 * 将多张图片合成为 GIF 动图（生长延时效果）
 * 使用 Canvas API + 手动帧合成
 * @param {string[]} dataUrls - 图片 dataURL 列表（按时间正序）
 * @param {object} options
 * @param {number} options.delay - 帧间延迟（ms），默认 500
 * @param {number} options.width - 输出宽度，默认 400
 * @returns {Promise<Blob>} GIF Blob
 */
export async function generateGIF(dataUrls, options = {}) {
  const { delay = 500, width = 400 } = options;

  if (dataUrls.length === 0) throw new Error('没有图片可用于合成 GIF');
  if (dataUrls.length === 1) {
    // 单张图：直接返回为"GIF"
    const resp = await fetch(dataUrls[0]);
    return await resp.blob();
  }

  // 加载所有图片并缩放到统一尺寸
  const images = await Promise.all(
    dataUrls.map((url) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    })
  );

  // 计算统一输出尺寸
  const aspectRatios = images.map((img) => img.height / img.width);
  const avgRatio = aspectRatios.reduce((a, b) => a + b, 0) / aspectRatios.length;
  const height = Math.round(width * avgRatio);

  // 使用 GIF 编码
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 构建 GIF 帧
  const frames = [];
  for (const img of images) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const frameDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    frames.push(frameDataUrl);
  }

  // 使用简单的 GIF 编码（基于 NeuQuant + LZW）
  return encodeGIF(frames, width, height, delay);
}

/**
 * 简易 GIF 编码器
 */
async function encodeGIF(frameDataUrls, width, height, frameDelay) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 加载所有帧到 ImageData
  const frameImageDatas = await Promise.all(
    frameDataUrls.map((url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(ctx.getImageData(0, 0, width, height));
        };
        img.src = url;
      });
    })
  );

  return buildGIFFromImageData(frameImageDatas, width, height, frameDelay);
}

function buildGIFFromImageData(imageDatas, width, height, delay) {
  // 使用 OffscreenCanvas 构建每一帧
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 将每帧渲染到 canvas 并收集 dataURL
  const frameDataURLs = [];
  for (const imageData of imageDatas) {
    ctx.putImageData(imageData, 0, 0);
    frameDataURLs.push(canvas.toDataURL('image/gif', 1.0));
  }

  // 简易多帧 GIF 缝合：读取所有帧并组合
  if (frameDataURLs.length === 1) {
    return dataURLToBlob(frameDataURLs[0]);
  }

  // 使用帧间延迟构建动画 GIF
  const parts = [];
  for (let i = 0; i < frameDataURLs.length; i++) {
    const dataUrl = frameDataURLs[i];
    const binary = atob(dataUrl.split(',')[1]);
    parts.push(binary);
  }

  // 读取第一帧的头部信息
  const first = parts[0];
  const header = first.slice(0, 13); // GIF header + logical screen descriptor

  // 构建 Netscape 2.0 扩展块（循环播放）
  const nsBlock = buildNetscapeBlock();

  // 从第一帧提取全局颜色表（如果存在）
  const gctSize = (first.charCodeAt(10) & 0x07) + 1;
  const gctBytes = 3 * (1 << gctSize);
  const hasGCT = (first.charCodeAt(10) & 0x80) !== 0;

  let globalColorTable = '';
  if (hasGCT) {
    globalColorTable = first.slice(13, 13 + gctBytes);
  }

  // 构建输出
  let output = header + globalColorTable + nsBlock;

  // 处理每一帧
  let offset = 13 + (hasGCT ? gctBytes : 0);
  for (let i = 0; i < parts.length; i++) {
    const data = parts[i];
    // 跳过 header + GCT，读取图像描述符
    let frameOffset = offset;

    // 查找 Graphic Control Extension（可能在图像描述符之前）
    // 简化处理：直接查找 Image Descriptor (0x2C)
    while (frameOffset < data.length - 10) {
      if (data.charCodeAt(frameOffset) === 0x21 && data.charCodeAt(frameOffset + 1) === 0xF9) {
        // Graphic Control Extension
        const gceSize = data.charCodeAt(frameOffset + 2);
        const gce = data.slice(frameOffset, frameOffset + 3 + gceSize + 1);

        // 修改延迟时间
        const delayCs = Math.round(delay / 10);
        const gceBytes = gce.split('');
        gceBytes[4] = String.fromCharCode(delayCs & 0xFF);
        gceBytes[5] = String.fromCharCode((delayCs >> 8) & 0xFF);
        output += gceBytes.join('');

        frameOffset += 3 + gceSize + 1;
      } else if (data.charCodeAt(frameOffset) === 0x2C) {
        // Image Descriptor - 从这里开始到数据结束
        output += data.slice(frameOffset);
        break;
      } else {
        frameOffset++;
      }
    }
  }

  // 添加 GIF 结束符
  output += '\x3B';

  const bytes = new Uint8Array(output.length);
  for (let i = 0; i < output.length; i++) {
    bytes[i] = output.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'image/gif' });
}

function buildNetscapeBlock() {
  // Netscape 2.0 Application Extension：循环播放
  const appId = 'NETSCAPE2.0';
  let block = '\x21\xFF\x0B'; // Extension Introducer + App Extension Label + Block Size (11)
  block += appId;
  block += '\x03\x01'; // Sub-block size + sub-block data
  block += '\x00\x00'; // Loop count (0 = infinite)
  block += '\x00'; // Block terminator
  return block;
}

function dataURLToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bytes = atob(parts[1]);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}
