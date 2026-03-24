import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import { generateReceiptPDF } from '../utils/billing';

const unitLabel = (unit) => {
  const map = { piece: 'pcs', kg: 'kg', g: 'g', litre: 'L', ml: 'ml', size: 'size' };
  return map[unit] || unit;
};

const formatQty = (qty, unit) => {
  const q = parseFloat(qty);
  return `${q % 1 === 0 ? q : q.toFixed(3).replace(/\.?0+$/, '')} ${unitLabel(unit)}`;
};

export default function POSScreen() {
  const products = useStore(state => state.products);
  const cart = useStore(state => state.cart);
  const addToCart = useStore(state => state.addToCart);
  const removeFromCart = useStore(state => state.removeFromCart);
  const updateCartItemQuantity = useStore(state => state.updateCartItemQuantity);
  const checkoutCart = useStore(state => state.checkoutCart);
  const shopProfile = useStore(state => state.shopProfile);

  const [qtyModal, setQtyModal] = useState(null); // product object
  const [qtyInput, setQtyInput] = useState('1');
  const [showCart, setShowCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentType, setPaymentType] = useState('Cash'); // 'Cash', 'Bank', 'Credit'

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalAmount = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const totalItems = cart.length;

  const openQtyModal = (product) => {
    const existing = cart.find(i => i.id === product.id);
    setQtyInput(existing ? existing.quantity.toString() : (product.unit === 'kg' || product.unit === 'g' || product.unit === 'litre' || product.unit === 'ml' ? '0.500' : '1'));
    setQtyModal(product);
  };

  const handleConfirmQty = () => {
    const qty = parseFloat(qtyInput);
    if (!qty || qty <= 0) { alert('Enter a valid quantity'); return; }
    const existing = cart.find(i => i.id === qtyModal.id);
    if (existing) {
      updateCartItemQuantity(qtyModal.id, qty);
    } else {
      addToCart(qtyModal, qty);
    }
    setQtyModal(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    for (const item of cart) {
      const product = products.find(p => p.id === item.id);
      if (product && parseFloat(product.stock_quantity) < parseFloat(item.quantity)) {
        Alert.alert('Out of Stock', `Not enough stock for ${item.name}. Available: ${formatQty(product.stock_quantity, product.unit)}`);
        return;
      }
    }
    try {
      const orderResult = await checkoutCart(customerName, paymentType);
      if (orderResult) {
        setShowCart(false);
        setCustomerName('');
        setPaymentType('Cash');
        Alert.alert(
          '✅ Order Placed!',
          `Total: ₹${orderResult.totalAmount.toFixed(2)}\nCustomer: ${customerName || 'Walk-in'}\nPayment: ${paymentType}`,
          [
            { text: 'No', style: 'cancel' },
            { text: 'Share 🧾', onPress: () => generateReceiptPDF(orderResult, shopProfile) }
          ]
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create order');
    }
  };

  const getCartItem = (productId) => cart.find(i => i.id === productId);

  const renderProduct = ({ item }) => {
    const cartItem = getCartItem(item.id);
    const inCart = !!cartItem;
    return (
      <TouchableOpacity
        style={[styles.productCard, inCart && styles.productCardActive]}
        onPress={() => openQtyModal(item)}
        activeOpacity={0.8}
      >
        <View style={styles.productCardTop}>
          <View style={[styles.unitPill, inCart && styles.unitPillActive]}>
            <Text style={[styles.unitPillText, inCart && styles.unitPillTextActive]}>
              {unitLabel(item.unit || 'piece')}
            </Text>
          </View>
          {inCart && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{formatQty(cartItem.quantity, item.unit)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productstock}>
          Stock: {formatQty(item.stock_quantity, item.unit || 'piece')}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{item.selling_price}</Text>
          <View style={[styles.addBtnSmall, inCart && styles.addBtnSmallActive]}>
            <Text style={[styles.addBtnSmallText, inCart && styles.addBtnSmallTextActive]}>
              {inCart ? '✏️' : '+'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemQty}>{formatQty(item.quantity, item.unit || 'piece')} × ₹{item.selling_price}</Text>
      </View>
      <Text style={styles.cartItemTotal}>₹{(item.quantity * item.selling_price).toFixed(2)}</Text>
      <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
        <Text style={{ color: colors.danger, fontSize: 16 }}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Search products by name or category..."
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

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.productGrid}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No products match your search' : 'No products. Add some products first!'}
            </Text>
          </View>
        }
      />

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.cartFab} onPress={() => setShowCart(true)}>
          <Text style={styles.cartFabIcon}>🛒</Text>
          <View style={styles.cartFabInfo}>
            <Text style={styles.cartFabTotal}>₹{totalAmount.toFixed(2)}</Text>
            <Text style={styles.cartFabCount}>{totalItems} items</Text>
          </View>
          <Text style={styles.cartFabArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Quantity Input Modal */}
      <Modal visible={!!qtyModal} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.qtyOverlay}>
          {qtyModal && (
            <View style={styles.qtyModal}>
              <Text style={styles.qtyModalTitle}>{qtyModal.name}</Text>
              <Text style={styles.qtyModalPrice}>₹{qtyModal.selling_price} / {unitLabel(qtyModal.unit || 'piece')}</Text>
              <Text style={styles.qtyLabel}>Enter Quantity ({unitLabel(qtyModal.unit || 'piece')})</Text>
              <TextInput
                style={styles.qtyInput}
                keyboardType="decimal-pad"
                value={qtyInput}
                onChangeText={setQtyInput}
                autoFocus
                selectTextOnFocus
              />
              <Text style={styles.qtyPreview}>
                Total: ₹{(parseFloat(qtyInput || 0) * (qtyModal?.selling_price || 0)).toFixed(2)}
              </Text>
              <View style={styles.qtyBtns}>
                <TouchableOpacity style={styles.qtyCancelBtn} onPress={() => setQtyModal(null)}>
                  <Text style={styles.qtyCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.qtyConfirmBtn} onPress={handleConfirmQty}>
                  <Text style={styles.qtyConfirmText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* Cart Bottom Sheet */}
      <Modal visible={showCart} animationType="slide" transparent>
        <View style={styles.cartOverlay}>
          <View style={styles.cartSheet}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>🛒 Your Cart</Text>
              <TouchableOpacity onPress={() => setShowCart(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              <FlatList
                data={cart}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderCartItem}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.divider} />}
                ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textLight, padding: 16 }}>Cart is empty</Text>}
              />

              <View style={styles.divider} />

              {/* Customer Info */}
              <View style={styles.checkoutSection}>
                <Text style={styles.sectionLabel}>Customer Name (Optional)</Text>
                <TextInput
                  style={styles.customerInput}
                  placeholder="Enter name..."
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>

              {/* Payment Type */}
              <View style={styles.checkoutSection}>
                <Text style={styles.sectionLabel}>Payment Mode</Text>
                <View style={styles.paymentRow}>
                  {['Cash', 'Bank', 'Credit'].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.paymentBtn, paymentType === type && styles.paymentBtnActive]}
                      onPress={() => setPaymentType(type)}
                    >
                      <Text style={[styles.paymentBtnText, paymentType === type && styles.paymentBtnTextActive]}>
                        {type === 'Cash' ? '💵 ' : type === 'Bank' ? '🏦 ' : '💳 '}{type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.cartSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Items</Text>
                  <Text style={styles.summaryValue}>{totalItems}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount</Text>
                  <Text style={styles.summaryTotal}>₹{totalAmount.toFixed(2)}</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutBtnText}>Confirm Order  ₹{totalAmount.toFixed(2)}</Text>
            </TouchableOpacity>
            <View style={{ height: Platform.OS === 'ios' ? 20 : 10 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  productGrid: { padding: 12, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  productCard: {
    width: '48.5%', backgroundColor: colors.surface, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    borderWidth: 2, borderColor: 'transparent',
  },
  productCardActive: { borderColor: colors.primary, backgroundColor: '#EEF2FF' },
  productCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  unitPill: { backgroundColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  unitPillActive: { backgroundColor: colors.primary + '20' },
  unitPillText: { fontSize: 11, color: colors.textLight, fontWeight: '600' },
  unitPillTextActive: { color: colors.primary },
  cartBadge: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  productName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4, lineHeight: 18 },
  productstock: { fontSize: 11, color: colors.textLight, marginBottom: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  addBtnSmall: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  addBtnSmallActive: { backgroundColor: colors.secondary },
  addBtnSmallText: { color: '#fff', fontSize: 18, fontWeight: 'bold', lineHeight: 22 },
  addBtnSmallTextActive: { fontSize: 14 },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { textAlign: 'center', color: colors.textLight, fontSize: 16 },
  searchContainer: {
    padding: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center'
  },
  searchInput: {
    flex: 1, backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 15, color: colors.text,
  },
  clearSearchBtn: { padding: 8, marginLeft: 4 },
  cartFab: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    backgroundColor: colors.primary, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  cartFabIcon: { fontSize: 24, marginRight: 12 },
  cartFabInfo: { flex: 1 },
  cartFabTotal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cartFabCount: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  cartFabArrow: { color: '#fff', fontSize: 28, fontWeight: 'bold' },

  // Qty Modal
  qtyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  qtyModal: {
    backgroundColor: colors.surface, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  qtyModalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  qtyModalPrice: { fontSize: 14, color: colors.textLight, marginBottom: 20 },
  qtyLabel: { fontSize: 14, color: colors.textLight, marginBottom: 8 },
  qtyInput: {
    borderWidth: 2, borderColor: colors.primary, borderRadius: 12, padding: 16,
    fontSize: 24, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 8,
  },
  qtyPreview: { textAlign: 'center', color: colors.secondary, fontWeight: 'bold', fontSize: 16, marginBottom: 20 },
  qtyBtns: { flexDirection: 'row', gap: 12 },
  qtyCancelBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, alignItems: 'center',
  },
  qtyCancelText: { color: colors.textLight, fontWeight: '600' },
  qtyConfirmBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  qtyConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Cart Sheet
  cartOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  cartSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
  },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cartTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  closeBtn: { fontSize: 20, color: colors.textLight, padding: 4 },
  cartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  cartItemName: { fontSize: 15, fontWeight: '600', color: colors.text },
  cartItemQty: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  cartItemTotal: { fontSize: 15, fontWeight: 'bold', color: colors.primary, marginRight: 12 },
  removeBtn: { padding: 6 },
  divider: { height: 1, backgroundColor: colors.border },
  cartSummary: { backgroundColor: colors.background, borderRadius: 12, padding: 16, marginVertical: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 15, color: colors.textLight },
  summaryValue: { fontSize: 15, color: colors.text, fontWeight: '600' },
  summaryTotal: { fontSize: 22, fontWeight: 'bold', color: colors.primary },
  checkoutBtn: {
    backgroundColor: colors.primary, borderRadius: 14, padding: 18, alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  checkoutBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  // Checkout Extras
  checkoutSection: { marginTop: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textLight, marginBottom: 8 },
  customerInput: {
    backgroundColor: colors.background, borderRadius: 10, padding: 12, fontSize: 16, color: colors.text,
    borderWidth: 1, borderColor: colors.border,
  },
  paymentRow: { flexDirection: 'row', gap: 8 },
  paymentBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  paymentBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  paymentBtnText: { fontSize: 12, fontWeight: '600', color: colors.textLight },
  paymentBtnTextActive: { color: '#fff' },
});
