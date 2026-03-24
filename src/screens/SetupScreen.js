import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';

export default function SetupScreen() {
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [gst, setGst] = useState('');
  const createProfile = useStore(state => state.createProfile);

  const [isSaving, setIsSaving] = useState(false);
  const db = useStore(state => state.db);

  const handleSave = async () => {
    if (!db) {
      alert('Database not ready. Please check console for errors or reload.');
      return;
    }
    if (!shopName || !phone) {
      alert('Please enter Shop Name and Phone Number');
      return;
    }
    
    setIsSaving(true);
    try {
      await createProfile({ shop_name: shopName, phone, gst_number: gst });
    } catch (err) {
      console.error('Save Profile Error:', err);
      alert('Failed to save profile: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Image 
          source={require('../../assets/shop.png')} 
          style={styles.shopImage}
          resizeMode="contain"
        />
        <Text style={styles.title}>Stock</Text>
        <Text style={styles.subtitle}>Modern Inventory & POS</Text>

        <TextInput
          style={styles.input}
          placeholder="Shop Name *"
          value={shopName}
          onChangeText={setShopName}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number *"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <TextInput
          style={styles.input}
          placeholder="GST Number (Optional)"
          autoCapitalize="characters"
          value={gst}
          onChangeText={setGst}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 1,
  },
  shopImage: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
