"use client";
import { useState, useEffect } from 'react';
import { FaSearch, FaSpinner, FaImage, FaCheck, FaTimes } from 'react-icons/fa';
import { searchImages } from '../lib/googleImageSearch';
import { supabase } from '../lib/supabaseClient';

type ImageSearchProps = {
  entityType: 'workout' | 'exercise';
  entityId: string;
  entityName: string;
  existingImageUrl?: string | null;
  onImageSelect: (imageUrl: string | null) => void;
  className?: string;
};

export default function ImageSearch({
  entityType,
  entityId,
  entityName,
  existingImageUrl,
  onImageSelect,
  className = '',
}: ImageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ title: string; link: string; thumbnail: string }>>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(existingImageUrl || null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize search query based on entity name
  useEffect(() => {
    if (entityName && !searchQuery) {
      setSearchQuery(`${entityName} ${entityType === 'workout' ? 'workout' : 'exercise'}`);
    }
  }, [entityName, entityType, searchQuery]);

  // Handle search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setError(null);
    setIsSearching(true);

    try {
      // Check if we have API keys in environment variables
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY;
      const searchEngineId = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;
      
      if (!apiKey || !searchEngineId) {
        throw new Error('Google Search API key or Search Engine ID not configured');
      }
      
      const results = await searchImages(searchQuery, {
        apiKey,
        searchEngineId,
        imgSize: 'medium',
        num: 8
      });
      
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('No images found. Try a different search term.');
      }
    } catch (err) {
      console.error('Error searching for images:', err);
      setError('Failed to search for images. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  // Save selected image
  const saveSelectedImage = async () => {
    if (!selectedImage) return;
    
    setIsSaving(true);
    
    try {
      // Update the entity record in the database
      const tableName = entityType === 'workout' ? 'workout_plans' : 'exercises';
      const { error } = await supabase
        .from(tableName)
        .update({ image_url: selectedImage })
        .eq('id', entityId);

      if (error) {
        throw error;
      }

      // Call the callback
      onImageSelect(selectedImage);
    } catch (err) {
      console.error('Error saving image:', err);
      setError('Failed to save image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Clear selected image
  const clearSelectedImage = () => {
    setSelectedImage(null);
  };

  return (
    <div className={`image-search ${className}`}>
      <div className="mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            className="input input-bordered bg-slate-700 text-white flex-grow"
            placeholder="Search for images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="btn bg-teal-600 hover:bg-teal-700 text-white"
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? <FaSpinner className="animate-spin" /> : <FaSearch />}
          </button>
        </form>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <FaTimes className="mr-2" />
          <span>{error}</span>
        </div>
      )}

      {selectedImage && (
        <div className="mb-4">
          <div className="text-white font-semibold mb-2">Selected Image:</div>
          <div className="relative">
            <img
              src={selectedImage}
              alt="Selected"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={saveSelectedImage}
                disabled={isSaving}
                className="btn btn-sm bg-teal-600 hover:bg-teal-700 text-white"
                title="Save image"
              >
                {isSaving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
              </button>
              <button
                onClick={clearSelectedImage}
                className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                title="Clear selection"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        </div>
      )}

      {isSearching ? (
        <div className="flex justify-center items-center h-48">
          <FaSpinner className="animate-spin text-3xl text-teal-500" />
        </div>
      ) : searchResults.length > 0 ? (
        <div>
          <div className="text-white font-semibold mb-2">Search Results:</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className={`cursor-pointer rounded-lg overflow-hidden border-2 ${
                  selectedImage === result.link ? 'border-teal-500' : 'border-transparent'
                } hover:border-teal-500 transition-colors`}
                onClick={() => handleImageSelect(result.link)}
              >
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="w-full h-24 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      ) : !error && !isSearching && (
        <div className="text-center py-8 border-2 border-dashed border-slate-600 rounded-lg">
          <FaImage className="text-3xl text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400">
            Search for images to use for your {entityType}
          </p>
        </div>
      )}
    </div>
  );
} 