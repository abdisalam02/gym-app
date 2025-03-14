"use client";
import { useState, useRef, useEffect } from 'react';
import { FaUpload, FaImage, FaTrash, FaSpinner } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';

type ImageUploaderProps = {
  entityType: 'workout' | 'exercise';
  entityId: string;
  existingImageUrl?: string | null;
  onImageUpdate?: (imageUrl: string | null) => void;
  className?: string;
};

export default function ImageUploader({
  entityType,
  entityId,
  existingImageUrl,
  onImageUpdate,
  className = '',
}: ImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(existingImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageUrl(existingImageUrl || null);
  }, [existingImageUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${entityType}_${entityId}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${entityType}_images/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Update the image URL
      setImageUrl(publicUrl);
      
      // Update the entity record in the database
      const tableName = entityType === 'workout' ? 'workout_plans' : 'exercises';
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ image_url: publicUrl })
        .eq('id', entityId);

      if (updateError) {
        console.error('Error updating image URL in database:', updateError);
      }

      // Call the callback if provided
      if (onImageUpdate) {
        onImageUpdate(publicUrl);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!imageUrl) return;

    setUploading(true);
    try {
      // Extract the file path from the URL
      const urlParts = imageUrl.split('/');
      const filePath = urlParts[urlParts.length - 1];

      // Delete from Supabase Storage
      const { error: deleteError } = await supabase.storage
        .from('images')
        .remove([`${entityType}_images/${filePath}`]);

      if (deleteError) {
        throw deleteError;
      }

      // Update the entity record in the database
      const tableName = entityType === 'workout' ? 'workout_plans' : 'exercises';
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ image_url: null })
        .eq('id', entityId);

      if (updateError) {
        console.error('Error updating image URL in database:', updateError);
      }

      // Update state and call callback
      setImageUrl(null);
      if (onImageUpdate) {
        onImageUpdate(null);
      }
    } catch (err) {
      console.error('Error removing image:', err);
      setError('Failed to remove image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`image-uploader ${className}`}>
      {imageUrl ? (
        <div className="relative">
          <img 
            src={imageUrl} 
            alt={`${entityType} image`} 
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            onClick={handleRemoveImage}
            disabled={uploading}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
            title="Remove image"
          >
            {uploading ? <FaSpinner className="animate-spin" /> : <FaTrash />}
          </button>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center h-48 flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <>
              <FaSpinner className="animate-spin text-3xl text-teal-500 mb-2" />
              <p className="text-slate-400">Uploading...</p>
            </>
          ) : (
            <>
              <FaImage className="text-3xl text-slate-500 mb-2" />
              <p className="text-slate-400 mb-2">No image uploaded</p>
              <button className="btn btn-sm bg-teal-600 hover:bg-teal-700 text-white">
                <FaUpload className="mr-2" /> Upload Image
              </button>
            </>
          )}
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {error && (
        <div className="text-red-500 mt-2 text-sm">
          {error}
        </div>
      )}
    </div>
  );
} 