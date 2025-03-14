"use client";
import { useState, useEffect } from 'react';
import { getFirstImageUrl } from '../lib/googleImageSearch';
import { supabase } from '../lib/supabaseClient';
import { FaImage, FaSpinner, FaCheck, FaTimes, FaSync } from 'react-icons/fa';

type AutoImageFetchProps = {
  entityType: 'workout' | 'exercise';
  entityId: string;
  entityName: string;
  muscleGroup?: string | null;
  equipment?: string | null;
  existingImageUrl?: string | null;
  onImageFetched?: (imageUrl: string | null) => void;
  autoFetch?: boolean; // Whether to fetch automatically on mount
};

// Mapping for problematic exercises to use specific search terms
const PROBLEMATIC_EXERCISES: Record<string, string> = {
  'bench press': 'bench press exercise barbell chest workout',
  'squat': 'barbell squat exercise proper form',
  'deadlift': 'deadlift proper form exercise barbell',
  'leg curl': 'leg curl hamstring exercise machine',
  'leg extension': 'leg extension quadriceps exercise machine',
  'shoulder press': 'shoulder press dumbbell overhead exercise',
  'lat pulldown': 'lat pulldown back exercise cable machine',
  'bicep curl': 'bicep curl dumbbell arm exercise',
  'tricep extension': 'tricep extension cable exercise',
  'calf raise': 'calf raise standing exercise',
  'pull up': 'pull up back exercise proper form',
  'push up': 'push up chest exercise proper form'
};

export default function AutoImageFetch({
  entityType,
  entityId,
  entityName,
  muscleGroup,
  equipment,
  existingImageUrl,
  onImageFetched,
  autoFetch = true
}: AutoImageFetchProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(existingImageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetched, setIsFetched] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auto-fetch on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch && !existingImageUrl && entityName) {
      fetchImageForEntity();
    }
  }, [entityName, autoFetch, existingImageUrl]);

  // Update state when existingImageUrl changes
  useEffect(() => {
    setImageUrl(existingImageUrl || null);
  }, [existingImageUrl]);

  const generateSearchQuery = (isRetry = false): string => {
    const entityNameLower = entityName.toLowerCase();
    
    // For exercises
    if (entityType === 'exercise') {
      // Check if this is a problematic exercise with a specific search term
      for (const [key, value] of Object.entries(PROBLEMATIC_EXERCISES)) {
        if (entityNameLower.includes(key)) {
          return isRetry 
            ? `${value} fitness anatomy diagram` 
            : value;
        }
      }
      
      // For other exercises, construct a query based on available info
      let query = `${entityName} exercise`;
      
      if (muscleGroup) {
        query += ` ${muscleGroup}`;
      }
      
      if (equipment) {
        query += ` with ${equipment}`;
      }
      
      query += isRetry ? ' fitness workout' : ' muscle anatomy diagram';
      
      return query;
    } 
    // For workouts
    else {
      let query = `${entityName} workout routine`;
      return isRetry ? `${entityName} fitness program gym` : query;
    }
  };

  const fetchImageForEntity = async () => {
    if (!entityName) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate search query
      const query = generateSearchQuery(retryCount > 0);
      setSearchQuery(query);
      
      // Fetch image from Google
      const fetchedImageUrl = await getFirstImageUrl(query);
      
      if (fetchedImageUrl) {
        setImageUrl(fetchedImageUrl);
        
        // Save image URL to the database
        const tableName = entityType === 'workout' ? 'workout_plans' : 'exercises';
        await supabase
          .from(tableName)
          .update({ image_url: fetchedImageUrl })
          .eq('id', entityId);
        
        // Call onImageFetched callback if provided
        if (onImageFetched) {
          onImageFetched(fetchedImageUrl);
        }
        
        setIsFetched(true);
      } else if (retryCount < 3) {
        // Increment retry count and try again with a different query
        setRetryCount(prevCount => prevCount + 1);
        
        // Try again with a different query
        const newQuery = generateSearchQuery(true) + ` ${retryCount + 1}`;
        setSearchQuery(newQuery);
        
        const retryImageUrl = await getFirstImageUrl(newQuery);
        
        if (retryImageUrl) {
          setImageUrl(retryImageUrl);
          
          // Save image URL to the database
          const tableName = entityType === 'workout' ? 'workout_plans' : 'exercises';
          await supabase
            .from(tableName)
            .update({ image_url: retryImageUrl })
            .eq('id', entityId);
          
          // Call onImageFetched callback if provided
          if (onImageFetched) {
            onImageFetched(retryImageUrl);
          }
          
          setIsFetched(true);
        } else {
          setError(`Could not find an image (attempt ${retryCount + 1}). Try again or use a different name.`);
        }
      } else {
        setError("No image found after multiple attempts. Try a different name or search manually.");
      }
    } catch (err) {
      console.error('Error fetching image:', err);
      setError('Failed to fetch image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const retryFetch = () => {
    setRetryCount(0); // Reset retry count
    fetchImageForEntity();
  };

  const clearImage = async () => {
    setImageUrl(null);
    
    // Update database
    const tableName = entityType === 'workout' ? 'workout_plans' : 'exercises';
    await supabase
      .from(tableName)
      .update({ image_url: null })
      .eq('id', entityId);
    
    // Call onImageFetched callback if provided
    if (onImageFetched) {
      onImageFetched(null);
    }
    
    setIsFetched(false);
    setRetryCount(0);
  };

  return (
    <div className="w-full">
      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt={entityName}
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={fetchImageForEntity}
              disabled={isLoading}
              className="btn btn-sm btn-circle bg-slate-700 hover:bg-slate-600 text-white"
              title="Fetch new image"
            >
              <FaImage />
            </button>
            <button
              onClick={clearImage}
              className="btn btn-sm btn-circle bg-red-600 hover:bg-red-700 text-white"
              title="Clear image"
            >
              <FaTimes />
            </button>
          </div>
          {isFetched && (
            <div className="absolute bottom-2 right-2 bg-slate-800 bg-opacity-70 text-white px-2 py-1 rounded-lg text-xs flex items-center">
              <FaCheck className="mr-1 text-green-400" /> Auto-fetched
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-600 rounded-lg h-48 flex flex-col items-center justify-center">
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin text-3xl text-slate-400 mb-2" />
              <p className="text-slate-400">Fetching image...</p>
              {searchQuery && (
                <p className="text-slate-500 text-xs mt-2 px-4 text-center">
                  Searching for: "{searchQuery}"
                </p>
              )}
            </>
          ) : (
            <>
              <FaImage className="text-3xl text-slate-500 mb-2" />
              <p className="text-slate-400 text-center px-4 mb-2">
                {error || `No image for this ${entityType}`}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={fetchImageForEntity}
                  className="btn btn-sm bg-slate-700 hover:bg-slate-600"
                >
                  Auto-fetch Image
                </button>
                {retryCount > 0 && (
                  <button
                    onClick={retryFetch}
                    className="btn btn-sm bg-amber-600 hover:bg-amber-700"
                    title="Try again with different search terms"
                  >
                    <FaSync className="mr-1" /> Try Different Terms
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 