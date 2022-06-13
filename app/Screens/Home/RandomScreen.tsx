import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { HomeTabNavigationProps } from "../../Types/Navigations/HomeTab";

type RandomScreenProps = NativeStackScreenProps<
  HomeTabNavigationProps,
  "RandomScreen"
>;

const RandomScreen: React.FC<RandomScreenProps> = ({ navigation, route }) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}></SafeAreaView>
    </SafeAreaProvider>
  );
};
export default RandomScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF",
  },
});
