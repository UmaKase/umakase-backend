import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { InitialStepsProps } from "../Types/Navigations/InitialSteps";

//import screens
import step1 from "../Screens/InitialSettings/step1";
import step2 from "../Screens/InitialSettings/step2";

const InitialStepStack = createNativeStackNavigator<InitialStepsProps>();
const InitialStepsNavigation: React.FC = () => {
  return (
    <InitialStepStack.Navigator
      initialRouteName="step1"
      screenOptions={{ headerShown: false }}
    >
      <InitialStepStack.Screen name="step1" component={step1} />
      <InitialStepStack.Screen name="step2" component={step2} />
    </InitialStepStack.Navigator>
  );
};
export default InitialStepsNavigation;
