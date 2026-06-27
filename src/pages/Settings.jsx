import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { requestNotificationPermission, setupWeeklyReminder } from '../utils/notifications';

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function Settings() {
  const { reminderEnabled, reminderDay, reminderHour, reminderMinute, setReminder, loadSettings } = useStore();
  const [enabled, setEnabled] = useState(false);
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings().then(() => {
      const s = useStore.getState();
      setEnabled(s.reminderEnabled);
      setDay(s.reminderDay);
      setHour(s.reminderHour);
      setMinute(s.reminderMinute);
    });
  }, [loadSettings]);

  const handleToggle = async () => {
    if (!enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('请先在浏览器设置中允许通知权限');
        return;
      }
    }
    setEnabled(!enabled);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setReminder(enabled, day, hour, minute);
      if (enabled) {
        setupWeeklyReminder({ enabled: true, day, hour, minute });
      } else {
        if (window.__stagtraceReminderInterval) {
          clearInterval(window.__stagtraceReminderInterval);
        }
      }
      alert('设置已保存');
    } catch (err) {
      console.error('保存设置失败:', err);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-fern-900 mb-5">设置</h2>

      {/* 周提醒推送 */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-medium text-gray-800">周提醒推送</h3>
            <p className="text-xs text-gray-400 mt-0.5">到时间会提醒你给鹿角蕨拍照</p>
          </div>
          <button
            onClick={handleToggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              enabled ? 'bg-fern-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {enabled && (
          <div className="space-y-3 pt-3 border-t border-fern-50">
            {/* 星期选择 */}
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">提醒日期</label>
              <div className="flex gap-1.5 flex-wrap">
                {weekDays.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setDay(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      day === i
                        ? 'bg-fern-600 text-white'
                        : 'bg-fern-50 text-gray-500 active:bg-fern-100'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* 时间选择 */}
            <div>
              <label className="block text-sm text-gray-500 mb-1.5">提醒时间</label>
              <div className="flex items-center gap-2">
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="input-field w-20 text-center"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                  ))}
                </select>
                <span className="text-gray-400">:</span>
                <select
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                  className="input-field w-20 text-center"
                >
                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                    <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                提醒文案: "该给你的鹿角蕨拍照啦！"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 保存按钮 */}
      <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
        {saving ? '保存中...' : '保存设置'}
      </button>

      {/* 应用信息 */}
      <div className="card mt-5">
        <h3 className="font-medium text-gray-800 mb-2">关于</h3>
        <p className="text-sm text-gray-500">鹿迹 StagTrace v1.0.0</p>
        <p className="text-xs text-gray-400 mt-1">鹿角蕨生长记录 PWA 应用</p>
        <p className="text-xs text-gray-400">数据仅存储于本地，不上传服务器</p>
      </div>
    </div>
  );
}
