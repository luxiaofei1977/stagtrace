import { useState, useEffect, useRef } from 'react';
import { getAllPlants, addPlant, addPhoto } from '../db/indexedDB';
import { compressImage } from '../utils/photo';

const DATE_REGEX = /\d{4}[-.]?\d{2}[-.]?\d{2}/;

export default function BatchImportModal({ onClose, onComplete }) {
  const [plants, setPlants] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [step, setStep] = useState('select'); // select | config | importing | done
  const [plantMode, setPlantMode] = useState('existing'); // existing | new
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [newPlantName, setNewPlantName] = useState('');
  const [source, setSource] = useState('');
  const [dateMode, setDateMode] = useState('auto'); // auto | manual
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [importing, setImporting] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState({ count: 0, plantName: '' });
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    getAllPlants().then(list => setPlants(list));
  }, []);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles(files);
    if (plants.length > 0) {
      setSelectedPlantId(plants[0].id);
    }
    setStep('config');
  };

  const handlePlantDropdownChange = (e) => {
    const val = e.target.value;
    if (val === '__new__') {
      setPlantMode('new');
      setSelectedPlantId('');
    } else {
      setPlantMode('existing');
      setSelectedPlantId(val);
    }
  };

  const extractDateFromFilename = (filename) => {
    const match = filename.match(DATE_REGEX);
    if (match) {
      const raw = match[0].replace(/\./g, '-');
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return raw;
      }
    }
    return null;
  };

  const handleConfirm = async () => {
    setError('');
    const plantName = plantMode === 'new' ? newPlantName.trim() : plants.find(p => p.id === selectedPlantId)?.variety || '';

    if (!plantName) {
      setError('请选择或输入植物名称');
      return;
    }

    setStep('importing');
    cancelRef.current = false;
    setImporting({ current: 0, total: selectedFiles.length });

    try {
      let plantId;
      if (plantMode === 'new') {
        const plant = await addPlant({ variety: plantName });
        plantId = plant.id;
      } else {
        plantId = selectedPlantId;
      }

      let importedCount = 0;
      const entries = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        if (cancelRef.current) break;

        const file = selectedFiles[i];
        setImporting({ current: i + 1, total: selectedFiles.length });

        // Determine date
        let takenAt;
        if (dateMode === 'auto') {
          const extracted = extractDateFromFilename(file.name);
          takenAt = extracted ? new Date(extracted).getTime() : file.lastModified;
        } else {
          takenAt = new Date(manualDate).getTime();
        }

        // Read file as dataURL
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Compress
        const compressed = await compressImage(dataUrl, 1200, 0.75);

        // Store
        await addPhoto({
          plantId,
          dataUrl: compressed,
          takenAt,
          source: source.trim() || undefined
        });

        entries.push({ id: '', plantId, dataUrl: compressed, takenAt });
        importedCount++;
      }

      if (cancelRef.current) {
        setStep('select');
        return;
      }

      setImportResult({ count: importedCount, plantName });
      setStep('done');
      if (onComplete) onComplete();
    } catch (err) {
      setError(`导入失败: ${err.message}`);
      setStep('config');
    }
  };

  const handleCancel = () => {
    if (step === 'importing') {
      cancelRef.current = true;
    }
    onClose();
  };

  const getThumbnailUrls = () => {
    return selectedFiles.map(file => URL.createObjectURL(file));
  };

  // Reset file input on close to allow re-selecting same files
  const handleClose = () => {
    selectedFiles.forEach((_, i) => {
      // revoke will happen on unmount
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-fern-900">批量导入</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* File Select Step */}
        {step === 'select' && (
          <div className="p-5 text-center">
            <p className="text-gray-600 mb-4">从手机相册多选照片，批量导入到植物档案中</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={triggerFileSelect}
              className="btn-primary text-lg px-8 py-3"
            >
              选择照片
            </button>
          </div>
        )}

        {/* Config Step */}
        {step === 'config' && (
          <div className="p-5 space-y-5">
            {/* File count info */}
            <div className="bg-fern-50 rounded-xl p-3 text-center">
              <span className="text-fern-700 font-medium">已选择 {selectedFiles.length} 张照片</span>
            </div>

            {/* Plant name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">植物名称</label>
              <select
                value={plantMode === 'new' ? '__new__' : selectedPlantId}
                onChange={handlePlantDropdownChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fern-500 focus:border-transparent"
              >
                {plants.map(p => (
                  <option key={p.id} value={p.id}>{p.nickname || p.variety}</option>
                ))}
                <option value="__new__">+ 创建新植物</option>
              </select>
              {plantMode === 'new' && (
                <input
                  type="text"
                  value={newPlantName}
                  onChange={e => setNewPlantName(e.target.value)}
                  placeholder="输入新植物名称"
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fern-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">来源（可选）</label>
              <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="如：花市购买、朋友赠送"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fern-500 focus:border-transparent"
              />
            </div>

            {/* Date mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">日期提取方式</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-fern-300 transition-colors">
                  <input
                    type="radio"
                    name="dateMode"
                    value="auto"
                    checked={dateMode === 'auto'}
                    onChange={() => setDateMode('auto')}
                    className="text-fern-600 focus:ring-fern-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">自动从文件名提取日期</div>
                    <div className="text-xs text-gray-500">识别文件名中的日期格式（如 2024-06-15），每张照片独立提取</div>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-fern-300 transition-colors">
                  <input
                    type="radio"
                    name="dateMode"
                    value="manual"
                    checked={dateMode === 'manual'}
                    onChange={() => setDateMode('manual')}
                    className="text-fern-600 focus:ring-fern-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">手动统一指定日期</div>
                    <div className="text-xs text-gray-500">所有照片使用同一个日期</div>
                  </div>
                </label>
              </div>
              {dateMode === 'manual' && (
                <input
                  type="date"
                  value={manualDate}
                  onChange={e => setManualDate(e.target.value)}
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-fern-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Thumbnail preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                照片预览（{selectedFiles.length} 张）
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`预览 ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClose}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 btn-primary py-2.5 text-sm font-medium"
              >
                确认导入
              </button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="p-5 text-center space-y-4">
            <div className="text-gray-600">
              处理中 {importing.current}/{importing.total} 张
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-fern-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${importing.total > 0 ? (importing.current / importing.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Done Step */}
        {step === 'done' && (
          <div className="p-5 text-center space-y-4">
            <div className="text-4xl">✅</div>
            <div className="text-gray-800 font-medium">
              成功导入 {importResult.count} 张照片到【{importResult.plantName}】
            </div>
            <button
              onClick={handleClose}
              className="btn-primary px-6 py-2.5"
            >
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
