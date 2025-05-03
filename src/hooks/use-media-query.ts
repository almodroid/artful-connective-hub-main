import { useEffect, useState } from 'react';

/**
 * A custom hook that returns a boolean indicating whether the given media query matches.
 * @param query The media query to check (e.g., "(max-width: 768px)")
 * @returns A boolean indicating whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if window is defined (client-side)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false; // Default to false on server-side
  });

  useEffect(() => {
    // Return early if window is not defined
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // Update matches state when the media query changes
    const updateMatches = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    // Add listener for media query changes
    mediaQuery.addEventListener('change', updateMatches);

    // Cleanup listener on unmount
    return () => {
      mediaQuery.removeEventListener('change', updateMatches);
    };
  }, [query]); // Re-run effect when query changes

  return matches;
}