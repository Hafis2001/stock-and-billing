import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { useStore } from './src/store/useStore';
import { openDatabase, initDB } from './src/db/database';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const setDB = useStore(state => state.setDB);
  const loadProfile = useStore(state => state.loadProfile);

  const setupApp = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('App: Opening Database...');
      const db = await openDatabase();
      
      console.log('App: Initializing Database...');
      await initDB(db);
      
      console.log('App: Setting DB in store...');
      setDB(db);
      
      console.log('App: Loading Profile...');
      await loadProfile();
      console.log('App: Ready.');
    } catch (e) {
      console.error('CRITICAL APP INIT ERROR:', e);
      setError(e.message || 'Failed to initialize database. Please check logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setupApp();
  }, [setDB, loadProfile]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#EF4444', marginBottom: 12 }}>⚠️ Initialization Error</Text>
        <Text style={{ fontSize: 16, color: '#4B5563', textAlign: 'center', marginBottom: 24 }}>{error}</Text>
        <TouchableOpacity 
          onPress={setupApp}
          style={{ backgroundColor: '#4F46E5', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <AppNavigator />;
}
