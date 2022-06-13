import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { InitialStepsProps } from "../../Types/Navigations/InitialSteps";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

type Props = NativeStackScreenProps<InitialStepsProps, "step2">;

const step2: React.FC<Props> = ({ navigation, route }) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}></SafeAreaView>
    </SafeAreaProvider>
  );
};

export default step2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF",
  },
});
