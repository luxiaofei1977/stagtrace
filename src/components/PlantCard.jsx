export default function PlantCard({ plant, onPress, onDelete }) {
  return (
    <div
      onClick={onPress}
      className="card flex items-center gap-3 cursor-pointer active:bg-fern-50 transition-colors"
    >
      {/* 缩略图 */}
      <div className="w-14 h-14 rounded-xl bg-fern-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {plant.coverPhoto ? (
          <img src={plant.coverPhoto} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">🌿</span>
        )}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-800 truncate">
          {plant.nickname || plant.variety || '未命名'}
        </h3>
        <p className="text-xs text-gray-400 truncate">
          {[plant.variety, plant.source].filter(Boolean).join(' · ') || '暂无信息'}
        </p>
        {plant.price && (
          <p className="text-xs text-fern-600 mt-0.5">购入价: {plant.price}</p>
        )}
      </div>

      {/* 删除按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-gray-300 hover:text-red-400 p-2 transition-colors"
        title="删除"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
