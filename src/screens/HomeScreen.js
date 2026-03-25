import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, FlatList } from 'react-native';
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

  const [showLowStockModal, setShowLowStockModal] = useState(false);

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
          <TouchableOpacity 
            style={styles.alertCard} 
            onPress={() => setShowLowStockModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.alertTitle}>⚠️ Low Stock Alert</Text>
            <Text style={styles.alertText}>{lowStockProducts.length} items are running low on stock. Tap to view.</Text>
          </TouchableOpacity>
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

      {/* Low Stock Modal */}
      <Modal visible={showLowStockModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚠️ Low Stock Items</Text>
              <TouchableOpacity onPress={() => setShowLowStockModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={lowStockProducts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.lowStockRow}>
                  <Text style={styles.lowStockName}>{item.name}</Text>
                  <Text style={styles.lowStockQty}>
                    {item.stock_quantity} {item.unit || 'piece'}
                  </Text>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </View>
      </Modal>
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

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, 
    padding: 24, maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.danger },
  closeBtn: { fontSize: 20, color: colors.textLight, padding: 4 },
  lowStockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  lowStockName: { fontSize: 16, color: colors.text, flex: 1 },
  lowStockQty: { fontSize: 16, fontWeight: 'bold', color: colors.danger },
  divider: { height: 1, backgroundColor: colors.border },
});
