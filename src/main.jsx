import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import App from './App';
import './index.css';

// SW 更新提示组件（autoUpdate 模式下静默更新 + 完成后提示刷新）
function PwaUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // 自动更新模式下，SW 检测到新版本会自动 skipWaiting
    // 这里仅用于在更新完成后提示用户刷新页面
    onRegisteredSW(swUrl, r) {
      if (r) {
        // 定期检查更新（每 60 分钟）
        setInterval(async () => {
          if (r.installing || !navigator.onLine) return;
          const resp = await fetch(swUrl, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          });
          if (resp?.status === 200) await r.update();
        }, 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between rounded-xl bg-green-800 px-4 py-3 text-white shadow-lg">
      <span className="text-sm">有新版本可用</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="rounded-lg bg-white px-3 py-1 text-sm font-medium text-green-800 active:bg-green-100"
      >
        刷新
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PwaUpdater />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
