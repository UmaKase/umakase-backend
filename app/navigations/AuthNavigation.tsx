import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

//import screens
import LoginScreen from "../Screens/Authentication/LoginScreen";
import RegisterScreen from "../Screens/Authentication/RegisterScreen";
import { AuthNavigationProps } from "../Types/Navigations/Auth";

const RootStack = createNativeStackNavigator<AuthNavigationProps>();
const AuthNavigation: React.FC = () => {
  return (
    <RootStack.Navigator
      initialRouteName="LoginScreen"
      screenOptions={{ headerShown: false }}
    >
      <RootStack.Screen name="LoginScreen" component={LoginScreen} />
      <RootStack.Screen name="RegisterScreen" component={RegisterScreen} />
    </RootStack.Navigator>
  );
};
export default AuthNavigation;
