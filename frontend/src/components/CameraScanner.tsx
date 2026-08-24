import React, { useRef, useState } from 'react';
import { Camera, Upload, Image as ImageIcon, Loader2, Video } from 'lucide-react';
import { LiveCameraModal } from './LiveCameraModal';

interface CameraScannerProps {
  onImageSelected: (file: File) => void;
  isLoading: boolean;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onImageSelected,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      onImageSelected(file);
    }
  };

  const handleCapturedImage = (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    onImageSelected(file);
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col items-center justify-center text-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      <LiveCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapturedImage}
      />

      {previewUrl ? (
        <div className="relative w-full max-w-sm h-48 rounded-xl overflow-hidden border border-slate-700 shadow-xl mb-4 group">
          <img
            src={previewUrl}
            alt="Scanned Food Wrapper Label"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center gap-2">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="px-3 py-1.5 bg-emerald-600/90 text-white rounded-lg text-xs font-semibold border border-emerald-500 hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
            >
              <Video className="h-3.5 w-3.5" />
              <span>Live Snap</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-900/90 text-white rounded-lg text-xs font-semibold border border-slate-700 hover:bg-slate-800"
            >
              Upload Photo
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsCameraOpen(true)}
          className="w-full border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-900/40 rounded-2xl p-8 cursor-pointer transition-all duration-300 group mb-4"
        >
          <div className="h-14 w-14 rounded-2xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-800/40 group-hover:scale-110 transition-transform">
            <Camera className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
            Live Camera Scan or Upload Label
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Point phone camera at chocolate packaging / FSSAI nutrition table
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setIsCameraOpen(true)}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/50 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Scanning OCR...</span>
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              <span>Open Live Phone Camera</span>
            </>
          )}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Image</span>
        </button>
      </div>
    </div>
  );
};

