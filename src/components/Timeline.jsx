import { useState } from 'react';

export default function Timeline({ photos, milestones, onDeletePhoto, onToggleMilestone }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  const getMilestoneForPhoto = (photoId) => {
    return milestones.find((m) => m.photoId === photoId);
  };

  const formatDate = (timestamp) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        还没有拍照记录，点击上方"拍照"按钮开始记录
      </div>
    );
  }

  return (
    <>
      <div className="relative pl-6 border-l-2 border-fern-200">
        {photos.map((photo, idx) => {
          const milestone = getMilestoneForPhoto(photo.id);
          const isMilestone = !!milestone;
          return (
            <div key={photo.id} className="relative pb-5 last:pb-0">
              {/* 时间轴节点 */}
              <div className={isMilestone ? 'milestone-dot' : 'timeline-dot'}></div>

              <div className={`card ${isMilestone ? 'ring-2 ring-amber-300 bg-amber-50/50' : ''}`}>
                {/* 日期 */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">{formatDate(photo.takenAt)}</span>
                  <div className="flex items-center gap-1">
                    {/* 里程碑标记按钮 */}
                    <button
                      onClick={() => onToggleMilestone(photo.id)}
                      className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                        isMilestone
                          ? 'bg-amber-100 text-amber-700 font-medium'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      title={isMilestone ? `里程碑: ${milestone.label}` : '标记为里程碑'}
                    >
                      {isMilestone ? `★ ${milestone.label}` : '☆ 里程碑'}
                    </button>
                    {/* 删除按钮 */}
                    <button
                      onClick={() => onDeletePhoto(photo.id)}
                      className="text-gray-300 hover:text-red-400 p-1 transition-colors"
                      title="删除照片"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 缩略图 */}
                <div
                  className="w-full h-40 rounded-xl bg-fern-50 overflow-hidden cursor-pointer"
                  onClick={() => setPreviewUrl(photo.dataUrl)}
                >
                  <img
                    src={photo.dataUrl}
                    alt={`${formatDate(photo.takenAt)} 照片`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* 光照信息 */}
                {photo.lightLevel !== null && photo.lightLevel !== undefined && (
                  <p className="text-xs text-gray-400 mt-1">
                    光照: {photo.lightLevel.toFixed(0)} Lux
                  </p>
                )}

                {/* 里程碑标签 */}
                {isMilestone && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span className="text-xs font-medium text-amber-700">{milestone.label}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 图片预览弹窗 */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="预览"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl p-2"
            onClick={() => setPreviewUrl(null)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
