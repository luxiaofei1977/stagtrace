import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import PlantCard from '../components/PlantCard';

export default function Home() {
  const navigate = useNavigate();
  const { plants, loading, loadPlants, deletePlant } = useStore();

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
        <button
          onClick={() => navigate('/add')}
          className="btn-primary flex items-center gap-1 text-sm"
        >
          <span className="text-lg leading-none">+</span> 添加植物
        </button>
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
    </div>
  );
}
