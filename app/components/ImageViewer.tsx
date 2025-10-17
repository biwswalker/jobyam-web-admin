import React from 'react';

interface ImageViewerProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

export default function ImageViewer({ imageUrl, alt, onClose }: ImageViewerProps) {
  // ถ้า imageUrl เป็น absolute path ของ public ให้แปลงกลับเป็น /noimages2.png
  let src = imageUrl;
  if (imageUrl.startsWith(window.location.origin + '/')) {
    src = imageUrl.replace(window.location.origin, '');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full mx-4">
        <button
          className="absolute cursor-pointer -top-10 -right-22 text-white hover:text-gray-300 transition-colors"
          onClick={onClose}
        >
          <span className="text-lg">✕</span> ปิด
        </button>
        <div className="bg-white rounded-lg p-2 flex justify-center items-center" style={{width: '1000px', height: '700px', maxWidth: '90vw', maxHeight: '80vw'}}>
          <img
            src={src}
            alt={alt}
            className="w-full h-full rounded object-contain"
            onClick={(e) => e.stopPropagation()}
            onError={e => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/noimages2.png";
            }}
          />
        </div>
      </div>
    </div>
  );
}
