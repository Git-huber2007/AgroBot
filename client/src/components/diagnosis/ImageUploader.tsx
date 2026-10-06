import React, { useRef, useState } from 'react';
import { Camera, UploadCloud, X, Loader2 } from 'lucide-react';
import { compressImage } from '../../lib/compressImage';

export interface ImageUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  files,
  onChange,
  maxFiles = 3,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFiles = async (incomingList: FileList | null) => {
    if (!incomingList || incomingList.length === 0) return;
    setErrorMsg(null);

    const availableSlots = maxFiles - files.length;
    if (availableSlots <= 0) {
      setErrorMsg(`Maximum ${maxFiles} images allowed.`);
      return;
    }

    const validNewFiles: File[] = [];
    setIsCompressing(true);

    try {
      const candidates = Array.from(incomingList).slice(0, availableSlots);
      for (const file of candidates) {
        if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
          setErrorMsg('Only JPEG, PNG, or WEBP images are supported.');
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          setErrorMsg('Image file size must be under 5 MB.');
          continue;
        }

        // Compress file
        const compressed = await compressImage(file);
        validNewFiles.push(compressed);
      }

      if (validNewFiles.length > 0) {
        onChange([...files, ...validNewFiles]);
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const removeFile = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {files.map((file, idx) => {
          const previewUrl = URL.createObjectURL(file);
          return (
            <div
              key={idx}
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 border-leaf-400 bg-stone-100 shadow-sm"
            >
              <img
                src={previewUrl}
                alt={`Leaf sample ${idx + 1}`}
                className="w-full h-full object-cover"
                onLoad={() => URL.revokeObjectURL(previewUrl)}
              />
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                aria-label={`Remove image ${idx + 1}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-white px-1.5 py-0.5 rounded">
                {(file.size / 1024).toFixed(0)} KB
              </span>
            </div>
          );
        })}

        {files.length < maxFiles && (
          <div className="flex-1 min-w-[200px] border-2 border-dashed border-stone-300 hover:border-leaf-500 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-stone-50/50 hover:bg-stone-50 transition-colors">
            {isCompressing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-leaf-600 animate-spin" />
                <span className="text-xs text-stone-600 font-medium">Optimizing photo...</span>
              </div>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-stone-400 mb-2" />
                <p className="text-xs sm:text-sm font-semibold text-stone-700">
                  Drag & drop plant photos here
                </p>
                <p className="text-xs text-stone-400 mt-0.5 mb-3">
                  Upload up to {maxFiles} images (JPEG, PNG, WEBP)
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-100 transition-colors min-h-[44px]"
                  >
                    Browse files
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-leaf-50 border border-leaf-200 text-leaf-800 rounded-lg hover:bg-leaf-100 transition-colors min-h-[44px]"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take Photo</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {errorMsg && (
        <p className="text-xs text-red-600 font-medium animate-fadeIn">{errorMsg}</p>
      )}
    </div>
  );
};
