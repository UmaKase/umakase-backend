import React from "react";
import { LogBox } from "react-native";

//intialize the font loading process
//import useFonts hook & AppLoading
import { useFonts } from "expo-font";
import AppLoading from "expo-app-loading";
// import Roboto
import {
  Roboto_400Regular as Roboto_Regular,
  Roboto_100Thin as Roboto_Thin,
  Roboto_700Bold as Roboto_Bold,
} from "@expo-google-fonts/roboto";
// import DancingScript
import {
  DancingScript_400Regular as Dancing_Regular,
  DancingScript_700Bold as Dancing_Bold,
} from "@expo-google-fonts/dancing-script";
// importing major-mono-display
import { MajorMonoDisplay_400Regular as MajorMonoDisplay } from "@expo-google-fonts/major-mono-display";
import RootRouter from "../Umakase-front-end/Routes/RootRouter";

export default function App() {
  //start setting the font would use into the useFonts hook
  let [fontsLoaded] = useFonts({
    Roboto_Regular,
    Roboto_Thin,
    Roboto_Bold,
    Dancing_Regular,
    Dancing_Bold,
    MajorMonoDisplay,
  });
  if (!fontsLoaded) {
    console.log("App loading");
    return <AppLoading />;
  }
  LogBox.ignoreLogs(["Remote debugger"]);
  return <RootRouter />;
}
