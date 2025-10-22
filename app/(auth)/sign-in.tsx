import Button from "@/components/common/Buttons/Button";
import React from "react";
import {Text, View, Image, TextInput, ScrollView, KeyboardAvoidingView, Platform, StatusBar, Pressable, TouchableOpacity, Keyboard, Touchable} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import { setToken, setRefreshToken, setUserFullname, setUserPhotoUrl, getInfoFromToken } from "@/utils/tokenStorage";
import {
  Eye,
  EyeOff,
} from "lucide-react-native";
import COLORS from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";



export default function SignInScreen() {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const router = useRouter();
  const [email, onChangeEmail] = React.useState('');
  const [password, onChangePassword] = React.useState('');
  const emailInputRef = React.useRef<TextInput>(null);
  const passwordInputRef = React.useRef<TextInput>(null);
  const [isError,setIsError] = React.useState(false)
  const [showPassword, setShowPassword] =React.useState(false);

  const login = async (email : string , password : string) => {
    const url = 'https://cafesansfil-api-r0kj.onrender.com/api/auth/login';

    const formBody = new URLSearchParams({
      grant_type: 'password',
      username: email.toLowerCase(),
      password: password,
      scope: '',
      client_id: 'string',
      client_secret: 'string'
    }).toString();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formBody
      });

      const data = await response.json();
      data.access_token && await setToken(data.access_token);
      data.refresh_token && await setRefreshToken(data.refresh_token);
      console.log(data);
      
      if (data.access_token && data.refresh_token) {
        // Fetch user info and store full name and photo URL
        try {
          const userInfo = await getInfoFromToken(data.access_token);
          if (userInfo) {
            // Store full name
            if (userInfo.first_name && userInfo.last_name) {
              const fullName = `${userInfo.first_name} ${userInfo.last_name}`;
              await setUserFullname(fullName);
              console.log('Stored user full name:', fullName);
            } else if (userInfo.name) {
              await setUserFullname(userInfo.name);
              console.log('Stored user name:', userInfo.name);
            } else if (userInfo.username) {
              await setUserFullname(userInfo.username);
              console.log('Stored username:', userInfo.username);
            }
            
            // Store photo URL
            if (userInfo.photo_url) {
              await setUserPhotoUrl(userInfo.photo_url);
              console.log('Stored user photo URL:', userInfo.photo_url);
            }
          }
        } catch (error) {
          console.error('Error fetching user info after login:', error);
        }
        
        setIsError(false)
        router.push("/");
      }
      else if (data.detail == "Incorrect email or password"){
        alert("Incorrect email or password")
        setIsError(true)

      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };


  return (
    <SafeAreaView  >
       <StatusBar />
      <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    
  >
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled" style={{  minHeight: "100%" }}>
    <TouchableOpacity onPress={() => router.push("/")}>
      <Ionicons name="close" size={30} color={COLORS.black} style={{marginTop: 16, marginLeft: 16}}/>
    </TouchableOpacity>
      <Image source={require("@/logoold.png")} style={styles.logo}/>
      <View style={styles.header}>
      <Text style={styles.textHeader}>
        Connectez-vous à votre compte
      </Text>
      </View>


    <Text style={isError ? styles.textFormR : styles.textForm}>
      <Text >
        Adresse e-mail ou nom d'utilisateur
      </Text>
      <Text style={{color: "#ff0000", fontSize: 19, fontWeight: "400"}}> *</Text>
    </Text>
      <TextInput
      
          style={isError ? styles.inputR : styles.input}
          ref={emailInputRef}
          onChangeText={onChangeEmail}
          value={email}
          placeholder="email@email.com"
          keyboardType="email-address"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          placeholderTextColor={"#A1A1A1"}
          onFocus={() => {
  setTimeout(() => {
    emailInputRef.current?.measureLayout(
      scrollViewRef.current as any,
      (x, y) => {
        scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
      }
    );
  }, 100);
}}
        />

      <Text style={isError ? styles.textFormR : styles.textForm}>
      <Text >
        Mot de passe
      </Text>
      <Text style={{color: "#ff0000", fontSize: 19, fontWeight: "400"}}> *</Text>
    </Text>

      <View style={isError ? styles.passwordContainerR : styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          ref={passwordInputRef}
          onChangeText={onChangePassword}
          value={password}
          placeholder="********"
          keyboardType="default"
          autoComplete="password"
          returnKeyType="done"
          placeholderTextColor={"#A1A1A1"}
          secureTextEntry={!showPassword}
          onFocus={() => {
            setTimeout(() => {
              passwordInputRef.current?.measureLayout(
                scrollViewRef.current as any,
                (x, y) => {
                  scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
                }
              );
            }, 100);
          }}
        />
        <TouchableOpacity 
          style={styles.passwordToggle}
          onPress={() => setShowPassword(!showPassword)}
        >
          {!showPassword ? (
            <EyeOff size={20} color="#666" />
          ) : (
            <Eye size={20} color="#666" />
          )}
        </TouchableOpacity>
      </View>
      
      <View style={{marginRight: "5%"}}>
        <Pressable
          onPress={() => router.push("/forgot")}
          style={({ pressed }) => [
        {
          opacity: pressed ? 0.5 : 1,
        }
          ]}
        >
          {({ pressed }) => (
        <Text 
          style={{
            color: pressed ? COLORS.black : COLORS.black, 
            textAlign: "right",
            padding: 8,
            fontWeight: "500"
          }}
        >
          Mot de passe oublié ?
        </Text>
          )}
        </Pressable>
      </View>


      <View style={styles.buttonView}>
      <Button onPress={() => login(email,password)}>Se connecter</Button>
      </View>
      <Button style={{margin:-10}} onPress={() => router.push("/sign-up")} type="secondary">Pas de compte ?</Button>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );


}

const styles = {
  scrollableLayout: {
    height: "100%",
    flexGrow: 1,
  },

  logo:{
    width: 150,
    height: 150,
    alignSelf: "center" as const,
  },
  header : {
    padding: 30,
  },
  textHeader:{
    fontSize: 34,
    fontWeight: "bold" as const,
    textAlign: "center" as const,
  },
  textForm: {
    textAlign: "left" as const,
    paddingLeft: 30,
    
  },
  input: {
    height: 40,
    margin: 20,
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
    borderColor: "#CCCCCC",
    
    
    
  },
  buttonView:{
    marginTop: -10,
    padding:20
  },
  inputR: {
    height: 40,
    margin: 20,
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
    borderColor: "#FF0000",
    
  },
  textFormR: {
    textAlign: "left" as const,
    paddingLeft: 30,
    color : "#FF0000",
  },
  passwordContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 40,
    margin: 20,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
    borderColor: "#CCCCCC",
    paddingHorizontal: 10,
  },
  passwordContainerR: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: 40,
    margin: 20,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
    borderColor: "#FF0000",
    paddingHorizontal: 10,
  },
  passwordInput: {
    flex: 1,
    height: 40,
    padding: 0,
    color: COLORS.black,
  },
  passwordToggle: {
    padding: 4,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: 5,
  },
  
}

