import { create } from 'zustand';
import * as Queries from '../db/queries';

export const useStore = create((set, get) => ({
  db: null,
  isDBReady: false,
  
  shopProfile: null,
  products: [],
  lowStockProducts: [],
  cart: [],

  setDB: (db) => set({ db, isDBReady: true }),

  // Auth / Profile
  loadProfile: async () => {
    const { db } = get();
    if (!db) return;
    const profile = await Queries.getShopProfile(db);
    set({ shopProfile: profile });
  },

  createProfile: async (profileData) => {
    const { db } = get();
    if (!db) return;
    await Queries.createShopProfile(db, profileData);
    await get().loadProfile();
  },

  // Products
  loadProducts: async () => {
    const { db } = get();
    if (!db) return;
    const products = await Queries.getProducts(db);
    const lowStock = await Queries.getLowStockProducts(db, 5);
    set({ products, lowStockProducts: lowStock });
  },

  addProduct: async (productData) => {
    const { db } = get();
    if (!db) return;
    await Queries.addProduct(db, productData);
    await get().loadProducts();
  },

  updateStock: async (productId, addQuantity, newPurchasePrice, newSellingPrice) => {
    const { db } = get();
    if (!db) return;
    await Queries.updateProductStock(db, productId, addQuantity, newPurchasePrice, newSellingPrice);
    await get().loadProducts();
  },

  deductStock: async (productId, deductQuantity, reason) => {
    const { db } = get();
    if (!db) return;
    await Queries.deductStock(db, productId, deductQuantity, reason);
    await get().loadProducts();
  },


  // Cart
  addToCart: (product, quantity = 1) => {
    set((state) => {
      const existing = state.cart.find((item) => item.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          ),
        };
      }
      return { cart: [...state.cart, { ...product, quantity }] };
    });
  },
  
  updateCartItemQuantity: (productId, quantity) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== productId),
    }));
  },

  clearCart: () => set({ cart: [] }),

  // Checkout
  checkoutCart: async (customerName, paymentType) => {
    const { db, cart } = get();
    if (!db || cart.length === 0) return null;
    
    const totalAmount = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
    
    const orderId = await Queries.createOrder(db, cart, totalAmount, customerName, paymentType);
    
    // Clear cart and reload products to get updated stock
    set({ cart: [] });
    await get().loadProducts();
    
    return { 
      orderId, 
      totalAmount, 
      customerName, 
      paymentType,
      cartAtCheckout: [...cart] 
    };
  }
}));
