import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { HomeStackNavigationProps } from "../Types/Navigations/HomeStack";
import InitialStepsNavigation from "./InitialStepsNavigation";
import * as SecureStore from "expo-secure-store";
import { CONFIG_KEY } from "../Constants/securestoreKey";

const HomeStack = createNativeStackNavigator<HomeStackNavigationProps>();

const HomeStackNavigation: React.FC = ({}) => {
  const [config, setConfig] = useState<boolean>();
  const checkConfig = async () => {
    const isConfig = await SecureStore.getItemAsync(CONFIG_KEY);
    if (isConfig) {
      setConfig(true);
    } else {
      setConfig(false);
    }
  };

  useEffect(() => {
    checkConfig();
  }, []);

  return (
    <HomeStack.Navigator
      initialRouteName={config ? "HomeTabNavigation" : "InitialStepsNavigation"}
      screenOptions={{ headerShown: false }}
    >
      <HomeStack.Screen
        name="HomeTabNavigation"
        component={HomeStackNavigation}
      />
      <HomeStack.Screen
        name="InitialStepsNavigation"
        component={InitialStepsNavigation}
      />
    </HomeStack.Navigator>
  );
};
export default HomeStackNavigation;
