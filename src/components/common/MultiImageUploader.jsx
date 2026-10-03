import { useState, useRef } from 'react';
import { getImageUrl } from '../../utils/imageUtils';
import toast from 'react-hot-toast';
import api from '../../services/api';

const MultiImageUploader = ({ value = [], onChange, folder, label }) => {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState(value);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Todos los archivos deben ser imágenes');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Cada imagen no puede superar los 5MB');
        return;
      }
    }

    setUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('imagen', file);

      try {
        const response = await api.post(`/upload/${folder}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(response.data.url);
      } catch (error) {
        toast.error(`Error subiendo ${file.name}`);
      }
    }

    const newImages = [...images, ...uploadedUrls];
    setImages(newImages);
    onChange(newImages);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onChange(newImages);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex flex-wrap gap-2 items-center">
        {images.map((url, index) => (
          <div key={index} className="relative w-24 h-24 border rounded overflow-hidden group">
            <img src={getImageUrl(url)} alt={`img-${index}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition"
            >
              ✕
            </button>
          </div>
        ))}
        <label className="w-24 h-24 border-2 border-dashed rounded flex items-center justify-center text-gray-400 cursor-pointer hover:border-blue-500 hover:text-blue-500">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <span className="text-3xl">+</span>
        </label>
      </div>
      {uploading && <p className="text-sm text-gray-500">Subiendo imágenes...</p>}
    </div>
  );
};

export default MultiImageUploader;