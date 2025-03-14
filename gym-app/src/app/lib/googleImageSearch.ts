/**
 * This file provides functionality to search for images using Google Custom Search API
 * You'll need to set up a Google Custom Search Engine and get an API key
 * See: https://developers.google.com/custom-search/v1/overview
 */

// The base URL for Google Custom Search API
const GOOGLE_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';

// Interface for the search options
interface SearchOptions {
  apiKey?: string;
  searchEngineId?: string;
  searchType?: 'image';
  imgSize?: 'icon' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  imgType?: 'clipart' | 'face' | 'lineart' | 'stock' | 'photo' | 'animated';
  safe?: 'active' | 'off';
  num?: number; // Number of results (1-10)
}

// Interface for the search result
interface SearchResult {
  title: string;
  link: string;
  thumbnail: string;
  context: string;
}

/**
 * Search for images using Google Custom Search API
 * @param query The search query
 * @param options Search options
 * @returns Array of search results
 */
export async function searchImages(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  // Get API key and search engine ID from environment variables or options
  const apiKey = options.apiKey || process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY;
  const searchEngineId = options.searchEngineId || process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;
  
  // Validate required parameters
  if (!apiKey || !searchEngineId) {
    throw new Error('Missing Google Search API key or Search Engine ID. Please set environment variables or provide in options.');
  }
  
  // Build the search URL with query parameters
  const params = new URLSearchParams({
    key: apiKey,
    cx: searchEngineId,
    q: query,
    searchType: options.searchType || 'image',
    imgSize: options.imgSize || 'medium',
    imgType: options.imgType || 'photo',
    safe: options.safe || 'active',
    num: String(options.num || 5)
  });
  
  const url = `${GOOGLE_SEARCH_API_URL}?${params.toString()}`;
  
  try {
    // Make the API request
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Search API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Format the results
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    return data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      thumbnail: item.image?.thumbnailLink || item.link,
      context: item.displayLink
    }));
  } catch (error) {
    console.error('Error searching for images:', error);
    throw error;
  }
}

/**
 * Search for a single image and return the URL
 * @param query The search query
 * @param options Search options
 * @returns URL of the first image found, or null if none found
 */
export async function getFirstImageUrl(
  query: string,
  options: SearchOptions = {}
): Promise<string | null> {
  try {
    const results = await searchImages(query, { ...options, num: 1 });
    return results.length > 0 ? results[0].link : null;
  } catch (error) {
    console.error('Error getting first image:', error);
    return null;
  }
} 