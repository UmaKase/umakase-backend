import React from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native-paper";
interface LoadingSpinnerProps {}
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({}) => {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#FFF" />
    </View>
  );
};
export default LoadingSpinner;

const styles = StyleSheet.create({
  loading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
