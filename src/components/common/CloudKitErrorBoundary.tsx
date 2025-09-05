import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Note: Error boundaries are class components and cannot use hooks

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

/**
 * Error boundary component for CloudKit operations
 * Catches JavaScript errors and displays user-friendly error messages
 */
export class CloudKitErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('CloudKit Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleShowDetails = () => {
    if (this.state.error) {
      Alert.alert(
        'Technical Error Details',
        `Error: ${this.state.error.message}\n\nStack: ${this.state.error.stack}`,
        [{ text: 'OK' }]
      );
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="warning" size={48} color="#EF4444" />
          </View>
          
          <Text style={styles.errorTitle}>App Error</Text>
          
          <Text style={styles.errorMessage}>
            Something went wrong with the app. This usually means:
          </Text>
          
          <View style={styles.errorList}>
            <Text style={styles.errorListItem}>• You're using Expo Go (not supported)</Text>
            <Text style={styles.errorListItem}>• Development build not installed</Text>
            <Text style={styles.errorListItem}>• CloudKit not properly configured</Text>
            <Text style={styles.errorListItem}>• iOS device required</Text>
          </View>
          
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={this.handleShowDetails}
            >
              <Ionicons name="information-circle" size={20} color="#6B7280" />
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FEF2F2',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  errorList: {
    marginBottom: 24,
  },
  errorListItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  detailsButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});
