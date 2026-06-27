import { useState, useRef } from 'react';
import { addPlant, addPhoto } from '../db/indexedDB';
import { compressImage } from '../utils/photo';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif', 'tiff', 'tif']);

function isImageFile(name) {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return false;
  return IMAGE_EXTENSIONS.has(name.slice(dot + 1).toLowerCase());
}

export default function Import() {
  const [status, setStatus] = useState('idle'); // idle | scanning | importing | done | error
  const [progress, setProgress] = useState({ current: '', plantIndex: 0, plantTotal: 0, photoCount: 0 });
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef(false);

  const fileToDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImport = async () => {
    if (typeof window.showDirectoryPicker !== 'function') {
      setErrorMsg('您的浏览器不支持 File System Access API。请使用 Chrome / Edge 桌面版浏览器。');
      setStatus('error');
      return;
    }

    abortRef.current = false;
    setResults([]);
    setErrorMsg('');

    let dirHandle;
    try {
      dirHandle = await window.showDirectoryPicker({ mode: 'read' });
    } catch {
      return; // user cancelled
    }

    // ---- Phase 1: Scan ----
    setStatus('scanning');
    setProgress({ current: '正在扫描文件夹结构...', plantIndex: 0, plantTotal: 0, photoCount: 0 });

    const plantsData = [];

    for await (const [name, handle] of dirHandle.entries()) {
      if (abortRef.current) break;
      if (handle.kind !== 'directory') continue;

      const files = [];
      for await (const [fname, fhandle] of handle.entries()) {
        if (fhandle.kind === 'file' && isImageFile(fname)) {
          const file = await fhandle.getFile();
          files.push({ name: fname, file });
        }
      }
      if (files.length === 0) continue;

      files.sort((a, b) => a.file.lastModified - b.file.lastModified);

      plantsData.push({ plantName: name, files });
    }

    if (plantsData.length === 0) {
      setErrorMsg('所选文件夹中没有找到包含图片的子文件夹。');
      setStatus('error');
      return;
    }

    // ---- Phase 2: Import ----
    setStatus('importing');
    const importResults = [];
    let totalPhotos = 0;

    for (let i = 0; i < plantsData.length; i++) {
      if (abortRef.current) break;

      const { plantName, files } = plantsData[i];
      setProgress({
        current: plantName,
        plantIndex: i + 1,
        plantTotal: plantsData.length,
        photoCount: totalPhotos
      });

      const plant = await addPlant({
        variety: plantName,
        nickname: '',
        source: '',
        price: '',
        notes: ''
      });

      let plantPhotoCount = 0;
      for (const { file } of files) {
        if (abortRef.current) break;
        try {
          const dataUrl = await fileToDataURL(file);
          const compressed = await compressImage(dataUrl, 1200, 0.75);
          await addPhoto({
            plantId: plant.id,
            dataUrl: compressed,
            takenAt: file.lastModified,
            label: ''
          });
          plantPhotoCount++;
          totalPhotos++;
        } catch (e) {
          console.error(`导入照片失败: ${file.name}`, e);
        }
        setProgress((prev) => ({ ...prev, photoCount: totalPhotos }));
      }

      importResults.push({ plantName, plantId: plant.id, photoCount: plantPhotoCount });
      setResults([...importResults]);
    }

    setStatus(abortRef.current ? 'done' : 'done');
  };

  const handleCancel = () => {
    abortRef.current = true;
  };

  const isSupported = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-fern-800 mb-2">批量导入</h2>
      <p className="text-sm text-gray-500 mb-6">
        选择「鹿角蕨时光机」文件夹，自动将每个子文件夹创建为植物档案，并导入其中的照片。
      </p>

      {!isSupported && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-amber-800 text-sm font-medium">浏览器不支持</p>
          <p className="text-amber-700 text-xs mt-1">
            File System Access API 仅支持 Chrome / Edge 桌面版浏览器。请使用桌面端浏览器打开此页面。
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* launch button */}
        {status === 'idle' || status === 'done' || status === 'error' ? (
          <button
            onClick={handleImport}
            disabled={!isSupported}
            className="w-full py-3 bg-fern-600 text-white rounded-xl font-semibold hover:bg-fern-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            选择文件夹并开始导入
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
          >
            取消导入
          </button>
        )}

        {/* error */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm">{errorMsg}</p>
          </div>
        )}

        {/* progress */}
        {status === 'scanning' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-700 text-sm">{progress.current}</span>
            </div>
          </div>
        )}

        {status === 'importing' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-green-800 text-sm font-medium">
                正在导入: {progress.current}（{progress.plantIndex}/{progress.plantTotal}）
              </span>
            </div>
            <p className="text-green-700 text-xs ml-8">
              已导入 {progress.photoCount} 张照片
            </p>
            {/* progress bar */}
            <div className="w-full bg-green-200 rounded-full h-2 ml-8">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.plantTotal ? (progress.plantIndex / progress.plantTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* results */}
        {results.length > 0 && (
          <div className="bg-white border border-fern-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-fern-50 border-b border-fern-100">
              <span className="text-fern-800 font-semibold text-sm">导入结果</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {results.map((r) => (
                <div key={r.plantId} className="px-4 py-3 flex justify-between items-center">
                  <span className="text-sm text-gray-700">{r.plantName}</span>
                  <span className="text-xs text-fern-600 bg-fern-50 px-2 py-1 rounded-full">
                    {r.photoCount} 张照片
                  </span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500">
              共导入 {results.length} 个植物，
              {results.reduce((s, r) => s + r.photoCount, 0)} 张照片
            </div>
          </div>
        )}

        {status === 'done' && results.length > 0 && (
          <button
            onClick={handleImport}
            className="w-full py-2 border border-fern-300 text-fern-700 rounded-xl font-medium hover:bg-fern-50 transition-colors text-sm"
          >
            继续导入其他文件夹
          </button>
        )}
      </div>
    </div>
  );
}
