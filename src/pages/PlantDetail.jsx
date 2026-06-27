import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { getPlant, getPhotosByPlant, getMilestonesByPlant, getWateringsByPlant, addPhoto, addWatering, addMilestone, deletePhoto, deleteMilestone, getLastWatering, getMilestoneByPhotoId, updatePlant } from '../db/indexedDB';
import { compressImage } from '../utils/photo';
import { generateGIF } from '../utils/gif';
import Timeline from '../components/Timeline';
import PhotoCapture from '../components/PhotoCapture';
import WateringTracker from '../components/WateringTracker';
import GifGenerator from '../components/GifGenerator';

export default function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const updatePlant = useStore((s) => s.updatePlant);

  const [plant, setPlant] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [waterings, setWaterings] = useState([]);
  const [lastWatering, setLastWatering] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showGifGenerator, setShowGifGenerator] = useState(false);
  const [lightLevel, setLightLevel] = useState(null);

  const loadData = useCallback(async () => {
    const [p, ph, m, w, lw] = await Promise.all([
      getPlant(id),
      getPhotosByPlant(id),
      getMilestonesByPlant(id),
      getWateringsByPlant(id),
      getLastWatering(id)
    ]);
    if (!p) { navigate('/'); return; }
    setPlant(p);
    ph.sort((a, b) => b.takenAt - a.takenAt);
    setPhotos(ph);
    setMilestones(m);
    w.sort((a, b) => b.wateredAt - a.wateredAt);
    setWaterings(w);
    setLastWatering(lw);
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  // 光照检测
  useEffect(() => {
    if ('AmbientLightSensor' in window) {
      try {
        const sensor = new AmbientLightSensor({ frequency: 1 });
        sensor.addEventListener('reading', () => setLightLevel(sensor.illuminance));
        sensor.addEventListener('error', () => {});
        sensor.start();
        return () => sensor.stop();
      } catch (e) {}
    }
  }, []);

  const handlePhotoTaken = async (dataUrl) => {
    try {
      const compressed = await compressImage(dataUrl, 1200, 0.7);
      const photo = await addPhoto({
        plantId: id,
        dataUrl: compressed,
        lightLevel: lightLevel,
        takenAt: Date.now()
      });

      // 更新封面图
      if (!plant.coverPhoto) {
        const updated = await updatePlant(id, { coverPhoto: compressed });
        setPlant(updated);
      }

      setPhotos((prev) => [photo, ...prev]);
      setShowPhotoCapture(false);
    } catch (err) {
      console.error('保存照片失败:', err);
      alert('保存照片失败，请重试');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('确定要删除这张照片吗？')) return;
    await deletePhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    // 更新封面图
    const remaining = photos.filter((p) => p.id !== photoId);
    const firstPhoto = remaining.length > 0 ? remaining[0] : null;
    const updated = await updatePlant(id, {
      coverPhoto: firstPhoto ? firstPhoto.dataUrl : null
    });
    setPlant(updated);
  };

  const handleToggleMilestone = async (photoId) => {
    const existing = milestones.find((m) => m.photoId === photoId);
    if (existing) {
      await deleteMilestone(existing.id);
      setMilestones((prev) => prev.filter((m) => m.id !== existing.id));
    } else {
      // 弹窗选择里程碑类型
      const types = ['首次出盾叶', '首次出孢子叶', '分株', '换盆', '上板', '其他'];
      const type = prompt('标记里程碑类型:\n' + types.map((t, i) => `${i + 1}. ${t}`).join('\n'));
      if (!type) return;
      // 判断用户输入的是数字还是文字
      const idx = parseInt(type) - 1;
      const milestoneLabel = idx >= 0 && idx < types.length ? types[idx] : type.trim();
      const newMilestone = await addMilestone({
        plantId: id,
        photoId,
        label: milestoneLabel || '里程碑'
      });
      setMilestones((prev) => [...prev, newMilestone]);
    }
  };

  const handleWatering = async (method) => {
    const w = await addWatering({ plantId: id, method });
    setWaterings((prev) => [w, ...prev]);
    setLastWatering(w);
  };

  const handleGenerateGIF = async () => {
    setShowGifGenerator(true);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  return (
    <div>
      {/* 返回按钮 */}
      <button onClick={() => navigate('/')} className="text-gray-400 p-1 mb-3 flex items-center gap-1">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm">返回</span>
      </button>

      {/* 植物信息卡片 */}
      <div className="card mb-4">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-2xl bg-fern-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {plant.coverPhoto ? (
              <img src={plant.coverPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">🌿</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800">
              {plant.nickname || plant.variety || '未命名'}
            </h2>
            {plant.variety && <p className="text-sm text-fern-600">{plant.variety}</p>}
            {plant.source && <p className="text-xs text-gray-400 mt-1">来源: {plant.source}</p>}
            {plant.price && <p className="text-xs text-gray-400">价格: {plant.price}</p>}
            {plant.notes && <p className="text-xs text-gray-500 mt-1 italic">{plant.notes}</p>}
          </div>
        </div>

        {/* 光照提示 */}
        {lightLevel !== null && (
          <div className={`mt-3 p-2 rounded-lg text-xs font-medium ${
            lightLevel < 3000 ? 'bg-amber-50 text-amber-700' :
            lightLevel > 25000 ? 'bg-red-50 text-red-700' :
            'bg-fern-50 text-fern-700'
          }`}>
            {lightLevel < 3000 && `当前光照 ${lightLevel.toFixed(0)} Lux — 建议补光`}
            {lightLevel >= 3000 && lightLevel <= 25000 && `当前光照 ${lightLevel.toFixed(0)} Lux — 光照适宜`}
            {lightLevel > 25000 && `当前光照 ${lightLevel.toFixed(0)} Lux — 建议遮阴`}
          </div>
        )}
      </div>

      {/* 操作按钮区 */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <button onClick={() => setShowPhotoCapture(true)} className="btn-primary text-sm flex items-center justify-center gap-1 py-2.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          拍照
        </button>
        <button
          onClick={handleGenerateGIF}
          disabled={photos.length === 0}
          className="btn-secondary text-sm flex items-center justify-center gap-1 py-2.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          GIF
        </button>
        <WateringTracker lastWatering={lastWatering} onWatering={handleWatering} />
      </div>

      {/* 浇水记录 */}
      {waterings.length > 0 && (
        <div className="card mb-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">浇水记录</h3>
          <div className="flex flex-wrap gap-2">
            {waterings.slice(0, 5).map((w) => (
              <span key={w.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                {new Date(w.wateredAt).toLocaleDateString('zh-CN')} {w.method === 'soak' ? '浸盆' : '浇水'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 时间轴 */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">
          生长时间轴 ({photos.length} 张照片)
        </h3>
        <Timeline
          photos={photos}
          milestones={milestones}
          onDeletePhoto={handleDeletePhoto}
          onToggleMilestone={handleToggleMilestone}
        />
      </div>

      {/* 拍照弹窗 */}
      {showPhotoCapture && (
        <PhotoCapture
          onCapture={handlePhotoTaken}
          onClose={() => setShowPhotoCapture(false)}
          lightLevel={lightLevel}
        />
      )}

      {/* GIF 生成弹窗 */}
      {showGifGenerator && (
        <GifGenerator
          photos={photos}
          onClose={() => setShowGifGenerator(false)}
        />
      )}
    </div>
  );
}
