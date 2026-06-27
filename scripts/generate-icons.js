/**
 * PWA 图标生成器（简易占位图标）
 * 运行: node scripts/generate-icons.js
 */
const fs = require('fs');
const path = require('path');

function generateSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#2d6a4f"/>
  <g transform="translate(${size * 0.5}, ${size * 0.45})">
    <text text-anchor="middle" font-size="${size * 0.35}" fill="white" font-family="serif">🦌</text>
  </g>
</svg>`;
}

const publicDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 生成 SVG 格式图标（manifest 中引用 SVG 也是可以的，但为兼容性我们也提供 PNG 替代）
// 由于我们无法在 node 中轻松转换 SVG -> PNG，将占位 SVG 文件直接写入
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), generateSVG(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), generateSVG(512));

console.log('Icons generated successfully.');
