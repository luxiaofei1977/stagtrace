import { useState, useRef } from 'react';
import { generateGIF } from '../utils/gif';

export default function GifGenerator({ photos, onClose }) {
  const [generating, setGenerating] = useState(false);
  const [gifUrl, setGifUrl] = useState(null);
  const [delay, setDelay] = useState(500);
  const imgRef = useRef(null);

  const handleGenerate = async () => {
    if (photos.length === 0) return;
    setGenerating(true);
    try {
      // 按时间正序排列
      const sorted = [...photos].sort((a, b) => a.takenAt - b.takenAt);
      const dataUrls = sorted.map((p) => p.dataUrl);
      const blob = await generateGIF(dataUrls, { delay, width: 400 });
      const url = URL.createObjectURL(blob);
      setGifUrl(url);
    } catch (err) {
      console.error('GIF 生成失败:', err);
      alert('GIF 生成失败: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!gifUrl) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = `stagtrace-gif-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">生长延时 GIF</h3>
          <button onClick={onClose} className="text-gray-400 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          将 {photos.length} 张历史照片合成为生长延时 GIF 动图
        </p>

        {/* 帧延迟设置 */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">
            帧间延迟: {delay}ms (约 {(delay / 1000).toFixed(1)} 秒/帧)
          </label>
          <input
            type="range"
            min="200"
            max="2000"
            step="100"
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="w-full accent-fern-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>快 (200ms)</span>
            <span>慢 (2000ms)</span>
          </div>
        </div>

        {/* GIF 预览区 */}
        {gifUrl && (
          <div className="mb-4">
            <img
              ref={imgRef}
              src={gifUrl}
              alt="生长延时 GIF"
              className="w-full rounded-xl border border-fern-100"
            />
          </div>
        )}

        {/* 操作按钮 */}
        <div className="space-y-2">
          {!gifUrl ? (
            <button
              onClick={handleGenerate}
              disabled={generating || photos.length === 0}
              className="btn-primary w-full"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  正在生成...
                </span>
              ) : (
                '生成 GIF'
              )}
            </button>
          ) : (
            <button onClick={handleDownload} className="btn-primary w-full">
              下载 GIF
            </button>
          )}
          <button onClick={onClose} className="btn-secondary w-full">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
