import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';

const unitLabel = (unit) => {
  const map = { piece: 'pcs', kg: 'kg', g: 'g', litre: 'L', ml: 'ml', size: 'size' };
  return map[unit] || unit;
};

const DEDUCT_REASONS = ['Damaged', 'Personal Use', 'Expired', 'Lost', 'Returned to Supplier', 'Other'];

export default function StockUpdateScreen() {
  const products = useStore(state => state.products);
  const updateStock = useStore(state => state.updateStock);
  const deductStock = useStore(state => state.deductStock);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mode, setMode] = useState('add'); // 'add' or 'deduct'
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [reason, setReason] = useState('Damaged');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setMode('add');
    setPurchasePrice(product.purchase_price.toString());
    setQuantity('');
    setReason('Damaged');
  };

  const handleSave = async () => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      Alert.alert('Invalid', 'Please enter a valid quantity');
      return;
    }

    try {
      if (mode === 'add') {
        const price = parseFloat(purchasePrice);
        if (!price || price <= 0) {
          Alert.alert('Invalid', 'Please enter a valid purchase price');
          return;
        }
        await updateStock(selectedProduct.id, qty, price);
        Alert.alert('✅ Done', `Added ${qty} ${unitLabel(selectedProduct.unit || 'piece')} to stock`);
      } else {
        await deductStock(selectedProduct.id, qty, reason);
        Alert.alert('✅ Done', `Deducted ${qty} ${unitLabel(selectedProduct.unit || 'piece')} (${reason})`);
      }
      setSelectedProduct(null);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update stock');
    }
  };

  const formatStock = (qty, unit) => {
    const q = parseFloat(qty);
    return `${q % 1 === 0 ? q : q.toFixed(3).replace(/\.?0+$/, '')} ${unitLabel(unit || 'piece')}`;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => handleSelectProduct(item)}>
      <View style={[styles.unitBadge]}>
        <Text style={styles.unitBadgeText}>{unitLabel(item.unit || 'piece')}</Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productStock}>Current Stock: {formatStock(item.stock_quantity, item.unit)}</Text>
      </View>
      <Text style={styles.arrowText}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Search product to update..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textLight}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            <Text style={{ color: colors.textLight, fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48 }}>📦</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No products match your search' : 'No products found. Add products first!'}
            </Text>
          </View>
        }
      />

      <Modal visible={!!selectedProduct} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          {selectedProduct && (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                  <Text style={styles.modalStock}>
                    Stock: {formatStock(selectedProduct.stock_quantity, selectedProduct.unit)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Mode Tabs */}
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeTab, mode === 'add' && styles.modeTabActiveAdd]}
                  onPress={() => setMode('add')}
                >
                  <Text style={[styles.modeTabText, mode === 'add' && styles.modeTabTextActive]}>
                    ➕  Add Stock
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeTab, mode === 'deduct' && styles.modeTabActiveDeduct]}
                  onPress={() => setMode('deduct')}
                >
                  <Text style={[styles.modeTabText, mode === 'deduct' && styles.modeTabTextActive]}>
                    ➖  Deduct Stock
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quantity Input */}
              <Text style={styles.label}>
                {mode === 'add' ? 'Quantity to Add' : 'Quantity to Deduct'} ({unitLabel(selectedProduct.unit || 'piece')})
              </Text>
              <TextInput
                style={[styles.input, mode === 'deduct' && styles.inputDeduct]}
                placeholder="e.g. 1.500"
                keyboardType="decimal-pad"
                value={quantity}
                onChangeText={setQuantity}
              />

              {/* Purchase Price (only for add) */}
              {mode === 'add' && (
                <>
                  <Text style={styles.label}>Purchase Price (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={purchasePrice}
                    onChangeText={setPurchasePrice}
                  />
                </>
              )}

              {/* Reason (only for deduct) */}
              {mode === 'deduct' && (
                <>
                  <Text style={styles.label}>Reason for Deduction</Text>
                  <View style={styles.reasonGrid}>
                    {DEDUCT_REASONS.map(r => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
                        onPress={() => setReason(r)}
                      >
                        <Text style={[styles.reasonChipText, reason === r && styles.reasonChipTextActive]}>
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.saveButton, mode === 'deduct' && styles.saveButtonDeduct]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  {mode === 'add' ? '✅  Update Stock' : '⚠️  Confirm Deduction'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerTitle: { fontSize: 15, color: colors.textLight, padding: 16, paddingBottom: 0 },
  listContainer: { padding: 16 },
  productCard: {
    backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  unitBadge: {
    backgroundColor: colors.primary + '15', borderRadius: 8, paddingHorizontal: 8,
    paddingVertical: 6, marginRight: 12, minWidth: 36, alignItems: 'center',
  },
  unitBadgeText: { color: colors.primary, fontWeight: 'bold', fontSize: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  productStock: { fontSize: 13, color: colors.secondary, fontWeight: '600' },
  arrowText: { fontSize: 24, color: colors.textLight, marginLeft: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: colors.textLight, fontSize: 14, marginTop: 12, textAlign: 'center' },
  searchContainer: {
    padding: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center'
  },
  searchInput: {
    flex: 1, backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 15, color: colors.text,
  },
  clearSearchBtn: { padding: 8, marginLeft: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  modalStock: { fontSize: 13, color: colors.secondary, marginTop: 4 },
  closeBtn: { fontSize: 20, color: colors.textLight, padding: 4 },

  // Mode Tabs
  modeRow: { flexDirection: 'row', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  modeTab: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: colors.background },
  modeTabActiveAdd: { backgroundColor: colors.secondary },
  modeTabActiveDeduct: { backgroundColor: colors.danger },
  modeTabText: { fontWeight: '600', color: colors.textLight },
  modeTabTextActive: { color: '#fff' },

  // Inputs
  label: { fontSize: 14, color: colors.textLight, marginBottom: 8, marginLeft: 2 },
  input: {
    backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 12, padding: 16, fontSize: 18, marginBottom: 16, color: colors.text, textAlign: 'center',
  },
  inputDeduct: { borderColor: colors.danger + '80' },

  // Reason Chips
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  reasonChip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  reasonChipActive: { backgroundColor: colors.danger, borderColor: colors.danger },
  reasonChipText: { color: colors.textLight, fontWeight: '500', fontSize: 13 },
  reasonChipTextActive: { color: '#fff' },

  // Save Button
  saveButton: { backgroundColor: colors.secondary, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveButtonDeduct: { backgroundColor: colors.danger },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
