"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

type ExerciseMediaProps = {
  exerciseId: string;
  exerciseName: string;
};

export default function ExerciseMedia({ exerciseId, exerciseName }: ExerciseMediaProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [exerciseData, setExerciseData] = useState<any>(null);

  useEffect(() => {
    async function fetchExerciseData() {
      try {
        // Check if API key exists
        const apiKey = process.env.NEXT_PUBLIC_EXERCISEDB_API_KEY;
        if (!apiKey) {
          setLoading(false);
          return; // Silently return without error
        }

        const response = await fetch(
          `https://exercisedb.p.rapidapi.com/exercises/exercise/${exerciseId}`,
          {
            headers: {
              'X-RapidAPI-Key': apiKey,
              'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        setGifUrl(data.gifUrl);
        setExerciseData(data);
      } catch (error) {
        console.error('Error fetching exercise data:', error);
        setError('Failed to load exercise media');
      } finally {
        setLoading(false);
      }
    }

    fetchExerciseData();
  }, [exerciseId, exerciseName]);

  if (!process.env.NEXT_PUBLIC_EXERCISEDB_API_KEY) {
    return null; // Don't render anything if API key is not configured
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error && !gifUrl) {
    return (
      <div className="flex flex-col justify-center items-center h-48 bg-slate-700 rounded-lg p-4">
        <FaExclamationTriangle className="text-amber-400 text-2xl mb-2" />
        <p className="text-slate-400 text-center text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden bg-slate-700 h-48">
      {gifUrl && (
        <Image
          src={gifUrl}
          alt={exerciseName}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 300px"
        />
      )}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-800 bg-opacity-80 p-2">
          <p className="text-amber-400 text-xs">
            <FaExclamationTriangle className="inline mr-1" />
            Using fallback image: {error}
          </p>
        </div>
      )}
    </div>
  );
} 