import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StorageStats } from '../../utils/storage-utils';
import { useTheme } from '../../contexts/theme.context';

/**
 * Props for StorageStatsCard component
 */
interface StorageStatsCardProps {
  /** Storage statistics data */
  stats: StorageStats;
  /** Callback function to refresh storage stats */
  onRefresh?: () => void;
  /** Last updated timestamp */
  lastUpdated?: string;
}

/**
 * Component to display storage usage statistics
 * Implements SOLID principles with single responsibility for stats display
 * Follows DRY principle by centralizing stats rendering logic
 * Uses KISS principle with clear, simple layout
 */
const StorageStatsCard: React.FC<StorageStatsCardProps> = ({ stats, onRefresh, lastUpdated }) => {
  const { theme } = useTheme();

  /**
   * Render a stat item with icon, label, and value
   */
  const renderStatItem = (
    icon: string,
    label: string,
    value: string,
    color: string = theme.colors.primary
  ) => (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: theme.isDark ? theme.colors.border : '#E3F2FD' }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      </View>
    </View>
  );

  /**
   * Render storage usage progress bar
   */
  const renderProgressBar = () => {
    // Use device storage info if available, otherwise fallback to estimate
    let totalStorage: number;
    let usagePercentage: number;
    let totalStorageFormatted: string;
    
    if (stats.deviceStorage) {
      // Convert formatted strings back to bytes for calculation
      totalStorage = 64 * 1024 * 1024 * 1024; // 64GB estimate
      usagePercentage = stats.deviceStorage.usagePercentage;
      totalStorageFormatted = stats.deviceStorage.totalSpace;
    } else {
      // Fallback to app storage estimate
      totalStorage = 100 * 1024 * 1024; // 100MB in bytes
      usagePercentage = Math.min((stats.totalSizeBytes / totalStorage) * 100, 100);
      totalStorageFormatted = '100 MB';
    }
    
    return (
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>Storage Usage</Text>
          <Text style={[styles.progressValue, { color: theme.colors.text }]}>
            {usagePercentage.toFixed(1)}%
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: theme.isDark ? theme.colors.border : '#E0E0E0' }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${usagePercentage}%`,
                backgroundColor: usagePercentage > 80 ? '#FF6B6B' : usagePercentage > 60 ? '#FFA726' : theme.colors.primary
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressSubtext, { color: theme.colors.textSecondary }]}>
          {stats.totalSizeFormatted} of {totalStorageFormatted} used
        </Text>
        {stats.deviceStorage && (
          <Text style={[styles.deviceStorageInfo, { color: theme.colors.textSecondary }]}>
            Device: {stats.deviceStorage.freeSpace} free of {stats.deviceStorage.totalSpace}
          </Text>
        )}
      </View>
    );
  };

  /**
   * Render storage breakdown section
   */
  const renderBreakdown = () => (
    <View style={styles.breakdownSection}>
      <Text style={[styles.breakdownTitle, { color: theme.colors.textSecondary }]}>Storage Breakdown</Text>
      
      <View style={styles.breakdownGrid}>
        <View style={styles.breakdownItem}>
          <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>Text Notes</Text>
          <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
            {stats.breakdown.text.count} notes
          </Text>
          <Text style={[styles.breakdownSize, { color: theme.colors.textSecondary }]}>
            {stats.breakdown.text.sizeFormatted}
          </Text>
        </View>
        
        <View style={styles.breakdownItem}>
          <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>Voice Notes</Text>
          <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
            {stats.breakdown.voice.count} notes
          </Text>
          <Text style={[styles.breakdownSize, { color: theme.colors.textSecondary }]}>
            {stats.breakdown.voice.sizeFormatted}
          </Text>
        </View>
        
        <View style={styles.breakdownItem}>
          <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>Metadata</Text>
          <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
            {stats.breakdown.metadata.count} items
          </Text>
          <Text style={[styles.breakdownSize, { color: theme.colors.textSecondary }]}>
            {stats.breakdown.metadata.sizeFormatted}
          </Text>
        </View>
      </View>
    </View>
  );

  /**
   * Format last updated timestamp
   */
  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.isDark 
          ? theme.colors.background 
          : '#F8FAFC' // Light gray background for light theme
      }
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIcon, { backgroundColor: theme.isDark ? theme.colors.border : '#E3F2FD' }]}>
            <Ionicons name="analytics-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Storage Usage</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {stats.totalSizeFormatted} used
            </Text>
            {lastUpdated && (
              <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>
                Last updated: {formatLastUpdated(lastUpdated)}
              </Text>
            )}
          </View>
        </View>
        
        {onRefresh && (
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: theme.isDark ? theme.colors.border : '#E3F2FD' }]}
            onPress={onRefresh}
            accessibilityLabel="Refresh storage statistics"
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Main Stats */}
      <View style={styles.mainStats}>
        {renderStatItem('document-text-outline', 'Total Notes', stats.totalNotes.toString())}
        {renderStatItem('mic-outline', 'Voice Notes', stats.voiceNotes.toString(), '#FF6B6B')}
        {renderStatItem('text-outline', 'Text Notes', stats.textNotes.toString(), '#4ECDC4')}
      </View>

      {/* Breakdown */}
      {renderBreakdown()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  lastUpdated: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  deviceStorageInfo: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mainStats: {
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  breakdownSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 20,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  breakdownLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  breakdownSize: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default StorageStatsCard;
