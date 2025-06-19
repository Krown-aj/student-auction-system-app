import React from 'react';
import { ActivityIndicator, ActivityIndicatorProps, StyleSheet, View } from 'react-native';

interface SpinnerProps {
  color?: string;
  size?: ActivityIndicatorProps['size'];
}

const Spinner: React.FC<SpinnerProps> = ({ color = '#fff', size = 'large' }) => {
  return (
    <View style={styles.backdrop}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default Spinner;