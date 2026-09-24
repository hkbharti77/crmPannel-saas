import { useState, useEffect, useCallback } from 'react';
import { MaskedSmsProvider } from '../types/sms';
import { fetchSmsProviders } from '../lib/smsApi';

export function useSmsProviders(businessId: string = 'default') {
  const [providers, setProviders] = useState<MaskedSmsProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSmsProviders(businessId);
      setProviders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load SMS providers');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  return { providers, loading, error, refetch: loadProviders };
}
