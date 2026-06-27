import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { setupWeeklyReminder, requestNotificationPermission } from '../utils/notifications';

const baseNavItems = [
  { path: '/', label: '植物', icon: '🌿' },
  { path: '/settings', label: '设置', icon: '⚙️' }
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { reminderEnabled, reminderDay, reminderHour, reminderMinute, loadSettings } = useStore();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function');
  }, []);

  useEffect(() => {
    loadSettings().then(() => {
      const state = useStore.getState();
      if (state.reminderEnabled) {
        requestNotificationPermission().then((granted) => {
          if (granted) {
            setupWeeklyReminder({
              enabled: true,
              day: state.reminderDay,
              hour: state.reminderHour,
              minute: state.reminderMinute
            });
          }
        });
      }
    });
  }, []);

  const navItems = isDesktop
    ? [...baseNavItems, { path: '/import', label: '导入', icon: '📥' }]
    : baseNavItems;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-fern-700 text-white px-4 py-3 safe-top sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold tracking-wide">鹿迹 StagTrace</h1>
          <span className="text-fern-200 text-sm">鹿角蕨生长记录</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 safe-bottom pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-fern-100 safe-bottom z-40">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center px-4 py-1 rounded-xl transition-colors ${
                  active ? 'text-fern-700' : 'text-gray-400'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs mt-0.5 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
