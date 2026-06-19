import { useEffect, useState } from 'react';
import { Redirect, Href } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { getProfile, routeForTipo } from '../lib/auth';

export default function Index() {
  const [href, setHref] = useState<Href | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setHref('/login');
        return;
      }
      const profile = await getProfile(session.user.id);
      setHref(routeForTipo(profile?.tipo));
    });
  }, []);

  if (!href) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  return <Redirect href={href} />;
}
