import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

export default function AddPlant() {
  const navigate = useNavigate();
  const { addPlant } = useStore();

  const [form, setForm] = useState({
    variety: '',
    nickname: '',
    source: '',
    price: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.variety.trim() && !form.nickname.trim()) return;
    setSaving(true);
    try {
      await addPlant({
        variety: form.variety.trim(),
        nickname: form.nickname.trim(),
        source: form.source.trim(),
        price: form.price.trim(),
        notes: form.notes.trim(),
        coverPhoto: null
      });
      navigate('/');
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="text-gray-400 p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-fern-900">添加植物</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">品种名称 *</label>
          <input
            type="text"
            className="input-field"
            placeholder="如：二叉鹿角蕨、皇冠鹿角蕨"
            value={form.variety}
            onChange={(e) => handleChange('variety', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">昵称</label>
          <input
            type="text"
            className="input-field"
            placeholder="给你的鹿角蕨取个名字"
            value={form.nickname}
            onChange={(e) => handleChange('nickname', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">来源</label>
          <input
            type="text"
            className="input-field"
            placeholder="如：购入渠道/日期"
            value={form.source}
            onChange={(e) => handleChange('source', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">购入价格</label>
          <input
            type="text"
            className="input-field"
            placeholder="如：¥128"
            value={form.price}
            onChange={(e) => handleChange('price', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">备注</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="补充说明..."
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving || (!form.variety.trim() && !form.nickname.trim())}
          className="btn-primary w-full"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </form>
    </div>
  );
}
