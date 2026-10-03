import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ImageUploader = ({ value, onChange, folder, label }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.append('imagen', file);

    try {
      const response = await api.post(`/upload/${folder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onChange(response.data.url);
      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Error uploading:', error);
      toast.error(error.response?.data?.error || 'Error al subir imagen');
      setPreview(value || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex items-center space-x-4">
        {preview ? (
          <div className="relative w-24 h-24 border rounded overflow-hidden">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 border-2 border-dashed rounded flex items-center justify-center text-gray-400">
            Sin imagen
          </div>
        )}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {uploading && <p className="text-sm text-gray-500 mt-1">Subiendo...</p>}
          <p className="text-xs text-gray-400 mt-1">Máximo 5MB. Formatos: jpg, png, gif, webp</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;