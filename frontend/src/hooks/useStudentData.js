import { useState, useEffect } from 'react';
import { fetchStudentResults } from '../services/api';

export function useStudentData(barcode) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!barcode) return;

    let isMounted = true;
    setLoading(true);

    fetchStudentResults(barcode)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load student results.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [barcode]);

  return { data, loading, error, refetch: () => setData(null) };
}
