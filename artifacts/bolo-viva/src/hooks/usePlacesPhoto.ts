import { useState, useEffect } from "react";

// In-memory cache shared across all hook instances (lives for the session)
const cache = new Map<string, string | null>();
// Track in-flight requests to avoid duplicate calls
const inFlight = new Map<string, Promise<string | null>>();

async function fetchPhoto(
  query: string,
  type: string
): Promise<string | null> {
  const key = `${type}::${query.toLowerCase()}`;
  if (inFlight.has(key)) return inFlight.get(key)!;

  const params = new URLSearchParams({ q: query, type });
  const promise = fetch(`/api/places/photo?${params}`)
    .then((r) => r.json())
    .then((d: any) => {
      const url: string | null = d.photoUrl ?? null;
      cache.set(key, url);
      inFlight.delete(key);
      return url;
    })
    .catch(() => {
      cache.set(key, null);
      inFlight.delete(key);
      return null;
    });

  inFlight.set(key, promise);
  return promise;
}

/**
 * Fetches an Unsplash photo for the given activity title.
 * Returns null while loading or if no photo is found.
 * Results are cached for the lifetime of the browser session.
 *
 * @param query  e.g. "Osteria dell'Orsa"
 * @param type   Activity type: RESTAURANT | BAR | EVENT | LOCATION | ACTIVITY
 * @param skip   set true to skip fetching (local image already exists)
 */
export function usePlacesPhoto(
  query: string | null,
  type: string = "ACTIVITY",
  skip = false
): string | null {
  const cacheKey = query ? `${type}::${query.toLowerCase()}` : "";

  const [photoUrl, setPhotoUrl] = useState<string | null>(() =>
    cacheKey ? (cache.get(cacheKey) ?? null) : null
  );

  useEffect(() => {
    if (!query || skip) return;
    const key = `${type}::${query.toLowerCase()}`;

    if (cache.has(key)) {
      setPhotoUrl(cache.get(key) ?? null);
      return;
    }

    let cancelled = false;
    fetchPhoto(query, type).then((url) => {
      if (!cancelled) setPhotoUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [query, type, skip]);

  return photoUrl;
}
