import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeData<T>(table: string, id?: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let channel: RealtimeChannel;
    
    // Initial fetch
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Handle query differently based on whether ID is provided
        let result;
        let fetchError;
        
        if (id) {
          // For single record
          const response = await supabase.from(table).select('*').eq('id', id).single();
          result = response.data;
          fetchError = response.error;
        } else {
          // For collection
          const response = await supabase.from(table).select('*');
          result = response.data;
          fetchError = response.error;
        }
        
        if (fetchError) {
          throw fetchError;
        }
        
        setData(result as unknown as T);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up realtime subscription
    const setupSubscription = () => {
      const channelName = id ? `${table}:id=eq.${id}` : table;
      
      channel = supabase
        .channel(channelName)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: table,
          ...(id ? { filter: `id=eq.${id}` } : {}) 
        }, payload => {
          // Handle different events
          if (payload.eventType === 'DELETE') {
            // If watching a collection and an item was deleted
            if (!id && Array.isArray(data)) {
              setData(prevData => {
                if (!prevData) return null;
                return (prevData as any).filter((item: any) => item.id !== payload.old.id) as T;
              });
            } 
            // If watching a specific item and it was deleted
            else if (id) {
              setData(null);
            }
          } 
          // INSERT or UPDATE events
          else {
            const newRecord = payload.new as any;
            
            // If watching a collection
            if (!id && Array.isArray(data)) {
              setData(prevData => {
                if (!prevData) return [newRecord] as unknown as T;
                
                // For update, replace the item; for insert, add it
                if (payload.eventType === 'UPDATE') {
                  return (prevData as any).map((item: any) => 
                    item.id === newRecord.id ? newRecord : item
                  ) as T;
                } else {
                  return [...(prevData as any), newRecord] as T;
                }
              });
            } 
            // If watching a specific item
            else if (id) {
              setData(newRecord as T);
            }
          }
        })
        .subscribe();
    };
    
    setupSubscription();
    
    return () => {
      // Clean up subscription
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, id]);
  
  return { data, loading, error };
} 