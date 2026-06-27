/**
 * 通知工具模块
 * 使用 Notification API + Service Worker 实现周提醒推送
 */

/**
 * 请求通知权限
 * @returns {Promise<boolean>} 是否已授权
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * 显示即时通知
 */
export function showNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  return new Notification(title, {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    ...options
  });
}

/**
 * 设置周提醒
 * @param {object} config - { enabled, day (0-6), hour, minute }
 */
export function setupWeeklyReminder(config) {
  const { enabled, day, hour, minute } = config;

  // 清除已有定时器
  if (window.__stagtraceReminderInterval) {
    clearInterval(window.__stagtraceReminderInterval);
  }

  if (!enabled) return;

  const checkAndNotify = () => {
    const now = new Date();
    if (now.getDay() === day && now.getHours() === hour && now.getMinutes() === minute) {
      showNotification('鹿迹 StagTrace', {
        body: '该给你的鹿角蕨拍照啦！',
        tag: 'stagtrace-weekly-reminder',
        requireInteraction: true
      });
    }
  };

  // 每分钟检查一次
  window.__stagtraceReminderInterval = setInterval(checkAndNotify, 60000);

  // 立即检查一次
  checkAndNotify();
}
