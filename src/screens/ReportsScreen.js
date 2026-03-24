import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { useStore } from '../store/useStore';
import { colors } from '../theme/colors';
import * as Queries from '../db/queries';

export default function ReportsScreen() {
  const db = useStore(state => state.db);
  const [dailySales, setDailySales] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const totalSalesAllTime = dailySales.reduce((sum, day) => sum + (day.total_sales || 0), 0);
  const totalGrossProfit = dailySales.reduce((sum, day) => sum + (day.gross_profit || 0), 0);
  const totalLossAllTime = dailySales.reduce((sum, day) => sum + (day.total_loss || 0), 0);
  const totalNetProfit = totalGrossProfit - totalLossAllTime;

  useEffect(() => {
    const fetchReports = async () => {
      if (db) {
        setLoading(true);
        try {
          const sales = await Queries.getDailySales(db);
          setDailySales(sales);
        } catch (e) {
          console.error('Fetch reports error:', e);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchReports();
  }, [db]);

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cellDate}>{item.date}</Text>
      <View style={styles.cellGroup}>
        <Text style={styles.cellSales}>Sales: ₹{item.total_sales?.toFixed(2)}</Text>
        <Text style={styles.cellLoss}>Loss: ₹{item.total_loss?.toFixed(2)}</Text>
        <Text style={[styles.cellProfit, { color: item.net_profit >= 0 ? colors.secondary : colors.danger }]}>
          Net: ₹{item.net_profit?.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Overall Performance (Net)</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Total Sales</Text>
              <Text style={styles.summaryValue}>₹{totalSalesAllTime.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryBox, { borderLeftWidth: 1, borderColor: colors.border }]}>
              <Text style={styles.summaryLabel}>Net Profit</Text>
              <Text style={[styles.summaryValue, { color: totalNetProfit >= 0 ? colors.secondary : colors.danger }]}>
                ₹{totalNetProfit.toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailSummary}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gross Profit (Sales):</Text>
              <Text style={styles.detailValue}>+ ₹{totalGrossProfit.toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Loss (Damages/Deductions):</Text>
              <Text style={[styles.detailValue, { color: colors.danger }]}>- ₹{totalLossAllTime.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Daily Performance</Text>
        
        <FlatList
          data={dailySales}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No sales or deduction data available yet.</Text>
            </View>
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 24,
  },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textLight, marginBottom: 16, textAlign: 'center' },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  summaryBox: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: colors.textLight, marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  
  detailSummary: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 14, color: colors.text },
  detailValue: { fontSize: 14, fontWeight: 'bold', color: colors.secondary },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  row: {
    backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1,
  },
  cellDate: { fontSize: 14, fontWeight: 'bold', color: colors.text, flex: 1 },
  cellGroup: { flex: 2, alignItems: 'flex-end' },
  cellSales: { fontSize: 13, color: colors.textLight },
  cellLoss: { fontSize: 13, color: colors.danger, marginVertical: 2 },
  cellProfit: { fontSize: 15, fontWeight: 'bold' },
  
  emptyContainer: { backgroundColor: colors.surface, padding: 40, borderRadius: 12, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: colors.textLight, fontSize: 14 },
});
