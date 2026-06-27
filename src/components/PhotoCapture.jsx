import { useRef, useState } from 'react';

export default function PhotoCapture({ onCapture, onClose, lightLevel }) {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [useCamera, setUseCamera] = useState(false);

  const startCamera = async () => {
    try {
      // 尝试调用后置摄像头
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      setStream(ms);
      setUseCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = ms;
          videoRef.current.play();
          setCameraReady(true);
        }
      }, 100);
    } catch (err) {
      console.error('无法启动摄像头:', err);
      alert('无法访问摄像头，请使用相册选取');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
      setCameraReady(false);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    onCapture(dataUrl);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onCapture(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50">
        <button onClick={handleClose} className="text-white p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-white text-sm font-medium">拍照记录</span>
        <div className="w-8" />
      </div>

      {/* 光照提示 */}
      {lightLevel !== null && (
        <div className={`mx-4 mt-2 px-3 py-1.5 rounded-lg text-xs font-medium text-center ${
          lightLevel < 3000 ? 'bg-amber-500/80 text-white' :
          lightLevel > 25000 ? 'bg-red-500/80 text-white' :
          'bg-fern-600/80 text-white'
        }`}>
          {lightLevel < 3000 && `当前光照 ${lightLevel.toFixed(0)} Lux — 建议补光后再拍`}
          {lightLevel >= 3000 && lightLevel <= 25000 && `当前光照 ${lightLevel.toFixed(0)} Lux — 光照适宜`}
          {lightLevel > 25000 && `当前光照 ${lightLevel.toFixed(0)} Lux — 建议遮阴后再拍`}
        </div>
      )}

      {/* 相机预览或模式选择 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {useCamera ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="text-center text-white space-y-6">
            <p className="text-lg">选择拍照方式</p>
            <div className="flex gap-4">
              <button
                onClick={startCamera}
                className="bg-white/10 border border-white/30 rounded-2xl px-8 py-4 hover:bg-white/20 transition-colors"
              >
                <div className="text-4xl mb-2">📷</div>
                <div className="text-sm">使用摄像头</div>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/10 border border-white/30 rounded-2xl px-8 py-4 hover:bg-white/20 transition-colors"
              >
                <div className="text-4xl mb-2">🖼️</div>
                <div className="text-sm">从相册选取</div>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}
      </div>

      {/* 底部拍照按钮 */}
      {useCamera && cameraReady && (
        <div className="pb-8 pt-3 flex justify-center bg-black">
          <button
            onClick={takePhoto}
            className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-white" />
          </button>
        </div>
      )}
    </div>
  );
}
