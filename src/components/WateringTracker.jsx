import { useState, useEffect } from 'react';
import { getWateringInterval } from '../utils/photo';

export default function WateringTracker({ lastWatering, onWatering }) {
  const [showMenu, setShowMenu] = useState(false);
  const [daysSince, setDaysSince] = useState(null);

  useEffect(() => {
    if (lastWatering) {
      const update = () => {
        const diff = Date.now() - lastWatering.wateredAt;
        setDaysSince(Math.floor(diff / (1000 * 60 * 60 * 24)));
      };
      update();
      const timer = setInterval(update, 60000);
      return () => clearInterval(timer);
    }
  }, [lastWatering]);

  const interval = getWateringInterval();
  const needsWatering = daysSince !== null && daysSince >= interval.min;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`text-sm flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl font-medium transition-colors w-full ${
          needsWatering
            ? 'bg-blue-500 text-white'
            : 'bg-blue-50 text-blue-600 border border-blue-200'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        {needsWatering ? '该浇水了!' : '浇水打卡'}
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-3">
            {/* 浇水状态 */}
            <div className="text-center mb-3">
              {lastWatering ? (
                <>
                  <p className="text-sm text-gray-500">距上次浇水</p>
                  <p className={`text-2xl font-bold ${needsWatering ? 'text-blue-600' : 'text-gray-700'}`}>
                    {daysSince} 天
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    推荐间隔: {interval.min}-{interval.max} 天
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400">暂无浇水记录</p>
              )}
            </div>

            {/* 浇水方式 */}
            <div className="space-y-2">
              <button
                onClick={() => { onWatering('water'); setShowMenu(false); }}
                className="w-full bg-blue-500 text-white rounded-lg py-2 text-sm font-medium active:bg-blue-600 transition-colors"
              >
                浇水
              </button>
              <button
                onClick={() => { onWatering('soak'); setShowMenu(false); }}
                className="w-full bg-blue-100 text-blue-700 rounded-lg py-2 text-sm font-medium active:bg-blue-200 transition-colors"
              >
                浸盆
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
