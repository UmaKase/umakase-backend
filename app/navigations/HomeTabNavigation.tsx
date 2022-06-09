import React from "react";
//navigator
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";
//screens
import { bg_LessDarkColor } from "../Constants/cssConst";
import RandomScreen from "../Screens/Home/RandomScreen";
import { HomeTabNavigationProps } from "../Types/Navigations/HomeTab";

type Props = {};

const HomeNavigation: React.FC<Props> = ({}) => {
  const BottomTab = createMaterialTopTabNavigator<HomeTabNavigationProps>();
  return (
    <BottomTab.Navigator
      initialRouteName="RandomScreen"
      tabBarPosition="bottom"
      screenOptions={{
        tabBarStyle: { backgroundColor: bg_LessDarkColor },
        tabBarActiveTintColor: "#FFF",
        tabBarIndicatorStyle: {
          backgroundColor: "white",
          height: 1,
        },
        tabBarLabelStyle: { color: "#FFF" },
      }}
    >
      <BottomTab.Screen
        name="RandomScreen"
        component={RandomScreen}
        options={{
          tabBarLabel: "Random",
          tabBarIcon: ({ color }) => (
            <Ionicons
              name="ios-chatbox-ellipses-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* <BottomTab.Screen
        name="FriendListScreen"
        component={HomeScreen}
        options={{
          tabBarLabel: "Friends",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="users" size={22} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="md-person-sharp" size={24} color={color} />
          ),
        }}
      /> */}
    </BottomTab.Navigator>
  );
};

export default HomeNavigation;
