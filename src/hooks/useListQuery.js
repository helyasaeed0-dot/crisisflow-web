import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/client';

const EMPTY = { items: [], pagination: { page: 1, pages: 1, total: 0 } };

/**
 * Loads a paginated list and reloads whenever params change.
 * Only the newest request may update the screen, so a slow response
 * from an older filter can never overwrite the current results.
 */
export default function useListQuery(fetcher, params) {
  const [result, setResult] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latestRef = useRef({ fetcher, params });
  const requestIdRef = useRef(0);
  const paramsKey = JSON.stringify(params);

  // Keep the latest fetcher and params for reloads triggered later (e.g. socket events)
  useEffect(() => {
    latestRef.current = { fetcher, params };
  });

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const { fetcher: fn, params: p } = latestRef.current;
    setLoading(true);

    try {
      const data = await fn(p);
      if (requestId === requestIdRef.current) {
        setResult(data);
        setError('');
      }
    } catch (err) {
      if (requestId === requestIdRef.current) setError(getErrorMessage(err));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [paramsKey, reload]);

  return { result, setResult, loading, error, setError, reload };
}