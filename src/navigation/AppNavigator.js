import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';

import SetupScreen from '../screens/SetupScreen';
import HomeScreen from '../screens/HomeScreen';
import ProductsScreen from '../screens/ProductsScreen';
import StockUpdateScreen from '../screens/StockUpdateScreen';
import POSScreen from '../screens/POSScreen';
import ReportsScreen from '../screens/ReportsScreen';
import BillsScreen from '../screens/BillsScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const shopProfile = useStore(state => state.shopProfile);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      >
        {!shopProfile ? (
          <Stack.Screen name="SetupScreen" component={SetupScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ProductsScreen" component={ProductsScreen} options={{ title: 'Products' }} />
            <Stack.Screen name="StockUpdateScreen" component={StockUpdateScreen} options={{ title: 'Update Stock' }} />
            <Stack.Screen name="POSScreen" component={POSScreen} options={{ title: 'Take Order' }} />
            <Stack.Screen name="ReportsScreen" component={ReportsScreen} options={{ title: 'Reports' }} />
            <Stack.Screen name="BillsScreen" component={BillsScreen} options={{ title: 'Manage Bills' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
