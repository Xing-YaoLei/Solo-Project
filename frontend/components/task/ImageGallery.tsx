"use client";

import { useState } from "react";
import { TaskImage } from "@/lib/types";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: TaskImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<TaskImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const beforeImages = images.filter((img) => img.type === "BEFORE");
  const afterImages = images.filter((img) => img.type === "AFTER");
  const referenceImages = images.filter((img) => img.type === "REFERENCE");

  const openLightbox = (imageList: TaskImage[], index: number) => {
    setCurrentIndex(index);
    setSelectedImage(imageList[index]);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const prevImage = (imageList: TaskImage[]) => {
    const newIndex = (currentIndex - 1 + imageList.length) % imageList.length;
    setCurrentIndex(newIndex);
    setSelectedImage(imageList[newIndex]);
  };

  const nextImage = (imageList: TaskImage[]) => {
    const newIndex = (currentIndex + 1) % imageList.length;
    setCurrentIndex(newIndex);
    setSelectedImage(imageList[newIndex]);
  };

  const ImageSection = ({
    title,
    imageList,
    bgClass,
  }: {
    title: string;
    imageList: TaskImage[];
    bgClass: string;
  }) => {
    if (imageList.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {imageList.map((image, index) => (
            <div
              key={image.id}
              className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer group ${bgClass}`}
              onClick={() => openLightbox(imageList, index)}
            >
              <img
                src={image.url}
                alt={image.description || title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {image.description && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-xs text-white truncate">
                    {image.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const allImages = [...beforeImages, ...afterImages, ...referenceImages];

  return (
    <div className="space-y-6">
      <ImageSection
        title="施工前"
        imageList={beforeImages}
        bgClass="bg-orange-50"
      />
      <ImageSection
        title="施工后"
        imageList={afterImages}
        bgClass="bg-green-50"
      />
      <ImageSection
        title="参考资料"
        imageList={referenceImages}
        bgClass="bg-blue-50"
      />

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
            onClick={closeLightbox}
          >
            <X className="h-8 w-8" />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              prevImage(allImages);
            }}
          >
            <ChevronLeft className="h-10 w-10" />
          </button>

          <img
            src={selectedImage.url}
            alt={selectedImage.description || ""}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              nextImage(allImages);
            }}
          >
            <ChevronRight className="h-10 w-10" />
          </button>

          {selectedImage.description && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <p className="text-white text-center">
                {selectedImage.description}
              </p>
            </div>
          )}

          <div className="absolute bottom-8 right-8 text-white/60 text-sm">
            {currentIndex + 1} / {allImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
