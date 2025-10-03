
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Helper function to fetch factories from Supabase
 * This can be reused across the application to ensure consistent factory fetching
 */
export const fetchFactories = async () => {
  try {
    console.log("Fetching factories from helper function...");
    
    // First try to get from cache to prevent multiple simultaneous requests
    const cachedFactories = localStorage.getItem('cachedFactories');
    if (cachedFactories) {
      const parsed = JSON.parse(cachedFactories);
      const cacheTime = localStorage.getItem('factoriesCacheTime');
      
      // Use cache if it's less than 5 minutes old
      if (cacheTime && (Date.now() - parseInt(cacheTime) < 300000)) {
        console.log("Using cached factories:", parsed);
        return { data: parsed, error: null };
      }
    }
    
    // If no cache or it's expired, fetch from Supabase
    const { data, error } = await supabase
      .from('factories')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching factories:', error);
      throw error;
    }
    
    // Cache the results
    localStorage.setItem('cachedFactories', JSON.stringify(data || []));
    localStorage.setItem('factoriesCacheTime', Date.now().toString());
    
    console.log("Factories loaded from helper:", data);
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in fetchFactories helper:', error);
    
    // On error, try to return cached data if available
    const cachedFactories = localStorage.getItem('cachedFactories');
    if (cachedFactories) {
      const parsed = JSON.parse(cachedFactories);
      console.log("Using cached factories after fetch error:", parsed);
      return { data: parsed, error };
    }
    
    return { data: [], error };
  }
};
