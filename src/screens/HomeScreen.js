import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const Icon = ({ emoji, size = 32 }) => (
  <Text style={{ fontSize: size }}>{emoji}</Text>
);

export default function HomeScreen({ navigation }) {
  const shopProfile = useStore(state => state.shopProfile);
  const loadProducts = useStore(state => state.loadProducts);
  const lowStockProducts = useStore(state => state.lowStockProducts);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const MenuCard = ({ title, icon, onPress, color }) => (
    <TouchableOpacity style={[styles.card, { borderTopColor: color, borderTopWidth: 4 }]} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon emoji={icon} size={32} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.shopName}>{shopProfile?.shop_name || 'Shop Owner'}</Text>
        </View>

        {lowStockProducts.length > 0 && (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>⚠️ Low Stock Alert</Text>
            <Text style={styles.alertText}>{lowStockProducts.length} items are running low on stock.</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.grid}>
          <MenuCard title="Take Order" color={colors.primary} icon="🛒" onPress={() => navigation.navigate('POSScreen')} />
          <MenuCard title="Bills" color="#EC4899" icon="🧾" onPress={() => navigation.navigate('BillsScreen')} />
          <MenuCard title="Products" color={colors.secondary} icon="📦" onPress={() => navigation.navigate('ProductsScreen')} />
          <MenuCard title="Update Stock" color={colors.warning} icon="📈" onPress={() => navigation.navigate('StockUpdateScreen')} />
          <MenuCard title="Reports" color="#8B5CF6" icon="📊" onPress={() => navigation.navigate('ReportsScreen')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 16, color: colors.textLight },
  shopName: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  alertCard: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5',
    borderRadius: 12, padding: 16, marginBottom: 24,
  },
  alertTitle: { color: colors.danger, fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  alertText: { color: '#991B1B' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%', backgroundColor: colors.surface, borderRadius: 16,
    padding: 20, marginBottom: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  iconContainer: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' },
});
