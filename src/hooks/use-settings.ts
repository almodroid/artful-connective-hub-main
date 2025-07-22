import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GoogleAdsSettings {
  ads_enabled: boolean;
  adsense_publisher_id: string;
  adsense_post_slot: string;
  adsense_reel_slot: string;
  adsense_project_slot: string;
  adsense_script: string;
}

export function useSettings() {
  const [adsSettings, setAdsSettings] = useState<GoogleAdsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', [
            'ads_enabled',
            'adsense_publisher_id',
            'adsense_post_slot',
            'adsense_reel_slot',
            'adsense_project_slot',
            'adsense_script',
          ]);
        if (error) throw error;
        const settingsObj = Object.fromEntries((data || []).map((s: any) => [s.key, s.value]));
        setAdsSettings({
          ads_enabled: settingsObj.ads_enabled === 'true',
          adsense_publisher_id: settingsObj.adsense_publisher_id || '',
          adsense_post_slot: settingsObj.adsense_post_slot || '',
          adsense_reel_slot: settingsObj.adsense_reel_slot || '',
          adsense_project_slot: settingsObj.adsense_project_slot || '',
          adsense_script: settingsObj.adsense_script || '',
        });
      } catch (err: any) {
        setError(err.message || 'Error fetching settings');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  return { adsSettings, loading, error };
} 