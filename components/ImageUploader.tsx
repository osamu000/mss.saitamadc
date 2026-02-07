
import React, { useRef, useState, useCallback } from 'react';
import { Camera, Image as ImageIcon, X, RefreshCw, Circle } from 'lucide-react';

interface ImageUploaderProps {
  onImageChange: (base64: string | undefined) => void;
  currentImage?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, currentImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // カメラを起動する
  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // 背面カメラを優先
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("カメラの起動に失敗しました。ブラウザの権限設定を確認してください。");
      // 失敗した場合は従来のファイル選択にフォールバックさせるための案内を出すか、
      // ここではエラー表示に留める
    }
  };

  // カメラを停止する
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  // 写真を撮影（キャプチャ）する
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // ビデオの解像度に合わせてキャンバスサイズを設定
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // 反転なしで描画（背面カメラ想定）
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        onImageChange(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    onImageChange(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold text-gray-700">現場画像 / 添付</label>
      
      {error && (
        <div className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {!currentImage && !isCameraActive && (
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={startCamera}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-gray-500 group"
          >
            <Camera className="w-8 h-8 mb-2 group-hover:text-indigo-500" />
            <span className="text-sm font-medium">カメラを起動</span>
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-gray-500 group"
          >
            <ImageIcon className="w-8 h-8 mb-2 group-hover:text-indigo-500" />
            <span className="text-sm font-medium">ファイルを選択</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </button>
        </div>
      )}

      {/* カメラプレビュー画面 */}
      {isCameraActive && (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl border-4 border-indigo-500 animate-in fade-in zoom-in duration-300">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          {/* 撮影用UIオーバーレイ */}
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div className="flex justify-end">
              <button 
                onClick={stopCamera}
                className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex justify-center items-center pb-4">
              <button 
                onClick={capturePhoto}
                className="group relative flex items-center justify-center"
              >
                <Circle className="w-20 h-20 text-white opacity-50" />
                <div className="absolute w-14 h-14 bg-white rounded-full group-active:scale-90 transition-transform shadow-lg border-4 border-gray-200" />
              </button>
            </div>
          </div>
          
          {/* キャプチャ用隠しキャンバス */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {currentImage && (
        <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-200 aspect-video group">
          <img src={currentImage} alt="Uploaded" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button
              onClick={removeImage}
              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-xl transform hover:scale-110 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full sm:hidden shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
