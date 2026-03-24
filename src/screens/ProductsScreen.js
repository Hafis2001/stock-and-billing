import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';

const UNITS = ['piece', 'kg', 'g', 'litre', 'ml', 'size'];

const unitLabel = (unit) => {
  const map = { piece: 'pcs', kg: 'kg', g: 'g', litre: 'L', ml: 'ml', size: 'size' };
  return map[unit] || unit;
};

export default function ProductsScreen() {
  const products = useStore(state => state.products);
  const addProduct = useStore(state => state.addProduct);
  const [modalVisible, setModalVisible] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('piece');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');

  const handleSave = async () => {
    if (!name || !purchasePrice || !sellingPrice) {
      alert('Please fill required fields (Name, Purchase Price, Selling Price)');
      return;
    }
    await addProduct({
      name, category, unit,
      purchase_price: parseFloat(purchasePrice) || 0,
      selling_price: parseFloat(sellingPrice) || 0,
      stock_quantity: parseFloat(initialStock) || 0,
    });
    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setName(''); setCategory(''); setUnit('piece');
    setPurchasePrice(''); setSellingPrice(''); setInitialStock('');
  };

  const formatStock = (qty, unit) => {
    const q = parseFloat(qty);
    return `${q % 1 === 0 ? q : q.toFixed(3).replace(/\.?0+$/, '')} ${unitLabel(unit)}`;
  };

  const renderItem = ({ item }) => (
    <View style={styles.productCard}>
      <View style={styles.unitBadge}>
        <Text style={styles.unitBadgeText}>{unitLabel(item.unit || 'piece')}</Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category || 'Uncategorized'}</Text>
        <Text style={styles.productStock}>Stock: {formatStock(item.stock_quantity, item.unit)}</Text>
      </View>
      <View style={styles.priceInfo}>
        <Text style={styles.sellingPrice}>₹{item.selling_price}</Text>
        <Text style={styles.purchasePrice}>Cost: ₹{item.purchase_price}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48 }}>📦</Text>
            <Text style={styles.emptyText}>No products found. Add your first product!</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Product Name *" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Category" value={category} onChangeText={setCategory} />

            <Text style={styles.label}>Unit Type *</Text>
            <View style={styles.unitRow}>
              {UNITS.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitChip, unit === u && styles.unitChipActive]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
                    {unitLabel(u)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Purchase Price *" keyboardType="decimal-pad" value={purchasePrice} onChangeText={setPurchasePrice} />
              <TextInput style={[styles.input, { flex: 1, marginLeft: 8 }]} placeholder="Selling Price *" keyboardType="decimal-pad" value={sellingPrice} onChangeText={setSellingPrice} />
            </View>

            <TextInput
              style={styles.input}
              placeholder={`Initial Stock (${unitLabel(unit)})`}
              keyboardType="decimal-pad"
              value={initialStock}
              onChangeText={setInitialStock}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Product</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContainer: { padding: 16, paddingBottom: 100 },
  productCard: {
    backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  unitBadge: {
    backgroundColor: colors.primary + '15', borderRadius: 8, padding: 6,
    marginRight: 12, minWidth: 36, alignItems: 'center',
  },
  unitBadgeText: { color: colors.primary, fontWeight: 'bold', fontSize: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
  productCategory: { fontSize: 12, color: colors.textLight, marginBottom: 2 },
  productStock: { fontSize: 13, color: colors.secondary, fontWeight: '600' },
  priceInfo: { alignItems: 'flex-end' },
  sellingPrice: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  purchasePrice: { fontSize: 12, color: colors.textLight, marginTop: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.textLight, fontSize: 16, marginTop: 12 },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    backgroundColor: colors.primary, width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  closeBtn: { fontSize: 20, color: colors.textLight, padding: 4 },
  label: { fontSize: 14, color: colors.textLight, marginBottom: 8, marginLeft: 4 },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 8 },
  unitChip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  unitChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  unitChipText: { color: colors.textLight, fontWeight: '500' },
  unitChipTextActive: { color: '#fff' },
  input: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, color: colors.text,
  },
  row: { flexDirection: 'row' },
  saveButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4, marginBottom: 16 },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
