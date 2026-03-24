import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, TextInput, Platform
} from 'react-native';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { generateReceiptPDF, generateCombinedBillsPDF } from '../utils/billing';

export default function BillsScreen() {
  const recentOrders = useStore(state => state.recentOrders);
  const loadRecentOrders = useStore(state => state.loadRecentOrders);
  const deleteOrders = useStore(state => state.deleteOrders);
  const shopProfile = useStore(state => state.shopProfile);
  
  const [loading, setLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      await loadRecentOrders();
      setLoading(false);
    };
    fetch();
  }, []);

  const filteredOrders = recentOrders.filter(o => 
    (o.customer_name || 'Walk-in').toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toString().includes(searchQuery)
  );

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleShareSingle = async (order) => {
    if (isSharing) return;
    setIsSharing(true);
    // Re-calculating items for billing utility (already attached in getRecentOrders)
    const orderResult = {
      orderId: order.id,
      totalAmount: order.total_amount,
      customerName: order.customer_name,
      paymentType: order.payment_type,
      cartAtCheckout: order.items
    };
    await generateReceiptPDF(orderResult, shopProfile);
    setIsSharing(false);
  };

  const handleShareSelected = async () => {
    if (selectedIds.length === 0 || isSharing) return;
    setIsSharing(true);
    const selectedOrders = recentOrders.filter(o => selectedIds.includes(o.id));
    const success = await generateCombinedBillsPDF(selectedOrders, shopProfile);
    setIsSharing(false);
    
    if (success) {
      Alert.alert(
        'Shared Successfully',
        'Do you want to clear these shared bills from local storage now?',
        [
          { text: 'Keep Them', style: 'cancel' },
          { 
            text: 'Clear Shared', 
            style: 'destructive',
            onPress: async () => {
              await deleteOrders(selectedIds);
              setSelectedIds([]);
              Alert.alert('Cleaned Up', 'Shared bills have been removed from local storage.');
            }
          }
        ]
      );
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity 
        style={[styles.orderCard, isSelected && styles.orderCardSelected]} 
        onPress={() => toggleSelect(item.id)}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderMain}>
            <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
              {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <View>
              <Text style={styles.orderId}>Order #${item.id}</Text>
              <Text style={styles.orderTime}>{item.local_time}</Text>
            </View>
          </View>
          <Text style={styles.orderAmount}>₹{parseFloat(item.total_amount).toFixed(2)}</Text>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.customerBox}>
            <Text style={styles.customerName}>👤 {item.customer_name || 'Walk-in'}</Text>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentText}>{item.payment_type}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.shareIconBtn, isSharing && { opacity: 0.5 }]} 
            onPress={() => handleShareSingle(item)}
            disabled={isSharing}
          >
            <Text style={{fontSize: 20}}>🧾</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && recentOrders.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID or Customer..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{fontSize: 48, marginBottom: 12}}>🧾</Text>
            <Text style={styles.emptyText}>No bills found.</Text>
          </View>
        }
      />

      {selectedIds.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>{selectedIds.length} Selected</Text>
            <TouchableOpacity onPress={() => setSelectedIds([])}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.mainShareBtn, isSharing && { opacity: 0.7 }]} 
            onPress={handleShareSelected}
            disabled={isSharing}
          >
            <Text style={styles.mainShareBtnText}>
              {isSharing ? 'Sharing... ⏳' : 'Share Combined PDF 📤'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  searchBar: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border },
  searchInput: { backgroundColor: colors.background, padding: 12, borderRadius: 10, fontSize: 15, color: colors.text },
  listContainer: { padding: 16, paddingBottom: 100 },
  orderCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1,
  },
  orderCardSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '05' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderMain: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.border,
    marginRight: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxTick: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  orderTime: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  orderAmount: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  orderFooter: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border + '50'
  },
  customerBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customerName: { fontSize: 14, color: colors.text, fontWeight: '500' },
  paymentBadge: { backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  paymentText: { fontSize: 11, color: colors.textLight, fontWeight: 'bold' },
  shareIconBtn: { padding: 8, backgroundColor: colors.background, borderRadius: 10 },
  
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, padding: 20,
    borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
  },
  selectionInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
  selectionCount: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  clearText: { color: colors.danger, fontWeight: 'bold' },
  mainShareBtn: {
    backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center'
  },
  mainShareBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: colors.textLight, fontSize: 16 },
});
