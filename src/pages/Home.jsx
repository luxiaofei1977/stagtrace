import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import PlantCard from '../components/PlantCard';
import BatchImportModal from '../components/BatchImportModal';

export default function Home() {
  const navigate = useNavigate();
  const { plants, loading, loadPlants, deletePlant } = useStore();
  const [showBatchImport, setShowBatchImport] = useState(false);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`确定要删除「${name}」及其所有关联记录吗？此操作不可撤销。`)) {
      await deletePlant(id);
    }
  };

  return (
    <div>
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-fern-900">我的鹿角蕨</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBatchImport(true)}
            className="btn-secondary flex items-center gap-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            批量导入
          </button>
          <button
            onClick={() => navigate('/add')}
            className="btn-primary flex items-center gap-1 text-sm"
          >
            <span className="text-lg leading-none">+</span> 添加植物
          </button>
        </div>
      </div>

      {/* 植物列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : plants.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-gray-500 mb-3">还没有记录任何鹿角蕨</p>
          <button onClick={() => navigate('/add')} className="btn-primary">
            添加第一株植物
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onPress={() => navigate(`/plant/${plant.id}`)}
              onDelete={() => handleDelete(plant.id, plant.nickname || plant.variety)}
            />
          ))}
        </div>
      )}

      {showBatchImport && (
        <BatchImportModal
          onClose={() => setShowBatchImport(false)}
          onComplete={() => loadPlants()}
        />
      )}
    </div>
  );
}
