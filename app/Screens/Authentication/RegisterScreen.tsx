import React, { useState } from "react";
import axios from "axios";
import {
  Alert,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import {
  bg_DarkColor,
  cornerRadius,
  windowHeight,
  windowWidth,
} from "../../Constants/cssConst";
import { Fontisto, Feather, FontAwesome } from "@expo/vector-icons";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthAPI } from "../../Constants/backendAPI";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthNavigationProps } from "../../Types/Navigations/Auth";
import AuthInput from "../../Components/Auth/AuthInput";

type Props = NativeStackScreenProps<AuthNavigationProps, "RegisterScreen">;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  //useState
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");

  const RegisterProcess = async () => {
    if (email == "" || name == "" || password == "" || passwordCheck == "") {
      return Alert.alert("Error", "Missing input value!");
    } else if (password != passwordCheck) {
      return Alert.alert(
        "Password check failed",
        "The password input is not the same, please check it again!"
      );
    }
    axios({
      method: "post",
      url: `${AuthAPI}/register`,
      data: {
        email: email,
        name: name,
        password: password,
      },
    })
      .then((result) => {
        return Alert.alert("Register", result.data.message, [
          { text: "OK", onPress: () => navigation.pop() },
        ]);
      })
      .catch((e) => {
        return Alert.alert("Register error", e.response.data.message);
      });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior="position">
          {/* Header */}
          <View style={styles.topContainer}>
            <TouchableOpacity
              style={styles.goback}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome
                name="angle-double-left"
                size={windowWidth * 0.12}
                color="#FFF"
              />
            </TouchableOpacity>
            <Text style={styles.headerTextContainer}>Register</Text>
          </View>
          {/* Body */}
          <View style={styles.mainContainer}>
            <AuthInput
              InputIcon={
                <Fontisto name="email" size={windowWidth * 0.07} color="#FFF" />
              }
              SetInputState={setEmail}
              PlaceHolder="Enter email"
              PasswordMode={false}
            />
            <AuthInput
              InputIcon={
                <Feather name="user" size={windowWidth * 0.07} color="#FFF" />
              }
              SetInputState={setName}
              PlaceHolder="Enter user name"
              PasswordMode={false}
            />
            <AuthInput
              InputIcon={
                <Fontisto
                  name="locked"
                  size={windowWidth * 0.07}
                  color="#FFF"
                />
              }
              SetInputState={setPassword}
              PlaceHolder="Enter password"
              PasswordMode={true}
            />
            <AuthInput
              InputIcon={
                <Fontisto
                  name="locked"
                  size={windowWidth * 0.07}
                  color="#FFF"
                />
              }
              SetInputState={setPasswordCheck}
              PlaceHolder="Enter password again"
              PasswordMode={true}
            />
          </View>
        </KeyboardAvoidingView>
        {/* Footer */}
        <View style={styles.bottomContainer}>
          <View style={styles.cuttingBottomContainer}>
            {/* Auth container */}
            <TouchableOpacity
              style={styles.authBtn}
              onPress={() => RegisterProcess()}
            >
              <Text style={styles.btnText}>SUBMIT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: bg_DarkColor,
  },
  //Header
  topContainer: {
    width: windowWidth,
    height: windowHeight * 0.2,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: windowHeight * 0.05,
  },
  goback: {
    width: windowWidth * 0.12,
    height: windowWidth * 0.12,
    marginRight: windowWidth * 0.88,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    color: "#FFF",
    fontFamily: "MajorMonoDisplay",
    fontSize: 54,
    paddingTop: windowHeight * 0.02,
  },
  //Body
  mainContainer: {
    width: windowWidth,
    height: windowHeight * 0.5,
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: cornerRadius,
    borderBottomRightRadius: cornerRadius,
  },
  //Footer
  bottomContainer: {
    width: windowWidth,
    height: windowHeight * 0.3,
  },
  cuttingBottomContainer: {
    flex: 1,
    backgroundColor: bg_DarkColor,
    borderTopLeftRadius: cornerRadius,
    borderBottomRightRadius: windowHeight * 0.3,
    alignItems: "center",
    // justifyContent: "center",
  },
  authBtn: {
    width: windowWidth * 0.5,
    height: windowHeight * 0.07,
    marginTop: cornerRadius / 1.5,
    borderWidth: 1.5,
    borderColor: "#FFF",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontSize: windowWidth * 0.075,
    color: "#FFF",
  },
});
