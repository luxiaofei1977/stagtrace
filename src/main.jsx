import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import App from './App';
import './index.css';

// SW 静默更新组件：页面加载后立即检查更新，检测到新 SW 自动刷新
function PwaUpdater() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // 页面加载后立即检查更新
    immediate: true,
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

  // 检测到新 SW 后静默自动刷新，不弹出提示条
  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <PwaUpdater />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
