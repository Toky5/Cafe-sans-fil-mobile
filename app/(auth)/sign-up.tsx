import Button from "@/components/common/Buttons/Button";
import React from "react";
import {Text, View, Image, TextInput, ScrollView, KeyboardAvoidingView, Platform,StatusBar,TouchableOpacity, Alert} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { setToken, setRefreshToken, setUserFullname, setUserPhotoUrl, getInfoFromToken } from "@/utils/tokenStorage";
import COLORS from "@/constants/Colors";



export default function SignInScreen() {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const router = useRouter();
  const [email, onChangeEmail] = React.useState('');
  const [password, onChangePassword] = React.useState('');
  const [passwordConf, onChangePasswordConf] = React.useState('');
  const [username, onChangeUsername] = React.useState('');
  const [firstName, onChangeFirstName] = React.useState('');
  const [lastName, onChangeLastName] = React.useState('');
  //const [matricule, onChangeMatricule] = React.useState('');
  const emailInputRef = React.useRef<TextInput>(null);
  const passwordInputRef = React.useRef<TextInput>(null);
  const passwordConfInputRef = React.useRef<TextInput>(null);
  const usernameInputRef = React.useRef<TextInput>(null);
  const firstNameInputRef = React.useRef<TextInput>(null);
  const lastNameInputRef = React.useRef<TextInput>(null);
  //const matriculeInputRef = React.useRef<TextInput>(null);
  const [isPassword, setIsPassword] = React.useState(true);
  //const [matriculeError, setMatriculeError] = React.useState(false);
  const [isLengthValid, setIsLengthValid] = React.useState(false);
  const [isUppercaseValid, setIsUppercaseValid] = React.useState(false);
  const [isNumberValid, setIsNumberValid] = React.useState(false);
  const [isSpecialCharValid, setIsSpecialCharValid] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [isVisibleConfirm, setIsVisibleConfirm] = React.useState(true);


  const signup = async (username: string, first_name: string, last_name: string, matricule: string ,email : string , password : string) => {
    const url = 'https://cafesansfil-api-r0kj.onrender.com/api/auth/register';

    const formBody = {
      username: username,
      first_name: first_name, 
      last_name: last_name,
      //matricule: matricule.toString(),
      email: email.toLowerCase(),
      password: password,
      photo_url: "https://example.com/",
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formBody)
      });
      console.log("Response status:", response.status);
      
      // Try to parse JSON, but handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          // Non-JSON response (like HTML error page)
          const textResponse = await response.text();
          console.log("Non-JSON response received (first 200 chars):", textResponse.substring(0, 200));
          data = { detail: 'Server returned non-JSON response' };
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        // If JSON parsing fails, treat as potential success
        data = { detail: 'Could not parse server response' };
      }
      
      console.log("Response data:", data);
      
      // Sometimes the server returns 500 but still creates the account
      // So we'll try to login regardless of the response status
      if (response.ok || response.status === 500) {
        // Account might be created, try to log in automatically
        Alert.alert(
          'Succès',
          'Inscription réussie ! Connexion en cours...',
          [{ text: 'OK' }]
        );
        
        // Automatically log in the user
        try {
          const loginUrl = 'https://cafesansfil-api-r0kj.onrender.com/api/auth/login';
          const loginFormBody = new URLSearchParams({
            grant_type: 'password',
            username: email.toLowerCase(),
            password: password,
            scope: '',
            client_id: 'string',
            client_secret: 'string'
          }).toString();

          const loginResponse = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: loginFormBody
          });

          const loginData = await loginResponse.json();
          
          if (loginData.access_token && loginData.refresh_token) {
            await setToken(loginData.access_token);
            await setRefreshToken(loginData.refresh_token);
            
            // Fetch and store user info
            const userInfo = await getInfoFromToken(loginData.access_token);
            if (userInfo) {
              // Store full name
              if (userInfo.first_name && userInfo.last_name) {
                const fullName = `${userInfo.first_name} ${userInfo.last_name}`;
                await setUserFullname(fullName);
                console.log('Stored user full name:', fullName);
              }
              
              // Store photo URL
              if (userInfo.photo_url) {
                await setUserPhotoUrl(userInfo.photo_url);
                console.log('Stored user photo URL:', userInfo.photo_url);
              }
            }
            
            router.push("/");
          } else {
            // Login failed, redirect to sign-in
            Alert.alert(
              'Compte créé',
              'Votre compte a été créé avec succès. Veuillez vous connecter.',
              [{ text: 'OK' }]
            );
            router.push("/sign-in");
          }
        } catch (loginError) {
          console.error('Auto-login failed:', loginError);
          // Account was created but auto-login failed
          Alert.alert(
            'Compte créé',
            'Votre compte a été créé avec succès. Veuillez vous connecter.',
            [{ text: 'OK' }]
          );
          router.push("/sign-in");
        }
      } else {
        // Handle different error formats from the API
        let errorMessage = 'Une erreur est survenue lors de l\'inscription.';
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail) && data.detail.length > 0) {
            const firstError = data.detail[0];
            if (firstError.msg) {
              errorMessage = firstError.msg;
            } else if (firstError.ctx && firstError.ctx.reason) {
              errorMessage = firstError.ctx.reason;
            }
            
            if (firstError.loc && firstError.loc[1] !== "body"){
             errorMessage += ` (Pour le champ de : ${firstError.loc[1]})`;
            }
            else if (firstError.input ){
              errorMessage += `Pour la valeur : ${firstError.input})`;
            }
          }
        }
        
        console.error('Sign up error:', errorMessage);
        Alert.alert(
          'Erreur d\'inscription',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      Alert.alert(
        'Erreur',
        'Une erreur réseau est survenue. Veuillez vérifier votre connexion et réessayer.',
        [{ text: 'OK' }]
      );
    }
  };

  const debug = () =>{
    console.log("Username:", username);
    console.log("First Name:", firstName);
    console.log("Last Name:", lastName);
    //console.log("Matricule:", matricule);
    console.log("Email:", email);
    console.log("Password:", password);
    
    /*
    if (matricule !== null) {
      signup(username, firstName, lastName, matricule, email, password);
    } else {
      alert('Veuillez entrer un numéro de matricule valide.');
    }
    */
  }
  const checkMatch = (password: string, passwordConf: string) => {
    if (password !== passwordConf) {
      setIsPassword(false);
    }
    else{
      setIsPassword(true);
    }
    
  }

  const validatePassword = (password: string) => {
    setIsLengthValid(password.length >= 6);
    setIsUppercaseValid(/[A-Z]/.test(password));
    setIsNumberValid(/\d/.test(password));
    setIsSpecialCharValid(/[@$!%*?&#]/.test(password));
  }

  /*
  const validateMatricule = (matricule: { toString: () => string; } ) => {
    if (matricule && !/^\d{8}$/.test(matricule.toString())) {
      setMatriculeError(true);
      alert("Le numéro de matricule doit contenir exactement 8 chiffres.");
    } else {
      setMatriculeError(false);
    }
  }
  */



  return (
    
    <SafeAreaView >
      <StatusBar />
      <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    
    
  >
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled" 
  >
    <TouchableOpacity 
  style={styles.backButton} 
  onPress={() => router.push("/sign-in")}
>
  <Ionicons name="arrow-back" size={24} color={COLORS.black} />
</TouchableOpacity>
    
      <Image source={require("@/logoold.png")} style={styles.logo}/>
      <View style={styles.header}>
      <Text style={styles.textHeader}>
        Créez un compte
      </Text>
      </View>

      <Text style={styles.textForm}>
            <Text >
              Prénom
            </Text>
            <Text style={{color: "#ff0000", fontSize: 19, fontWeight: "400"}}> *</Text>
      </Text>

      <TextInput
          style={styles.input}
          ref={firstNameInputRef}
          onChangeText={onChangeFirstName}
          autoCapitalize="words"
          value={firstName}
          placeholder="Jean"
          keyboardType="default"
          returnKeyType="next"
          autoComplete="name"
          onSubmitEditing={() => lastNameInputRef.current?.focus()}
          placeholderTextColor={"#A1A1A1"}
          onFocus={() => {
  setTimeout(() => {
    emailInputRef.current?.measureLayout(
      scrollViewRef.current as any,
      (x, y) => {
        scrollViewRef.current?.scrollTo({ y: y - 300, animated: true });
      }
    );
  }, 100);
}}
        />

      <Text style={styles.textForm}>
            <Text >
              Nom
            </Text>
            <Text style={{color: "#ff0000", fontSize: 19, fontWeight: "400"}}> *</Text>
          </Text>

      <TextInput
          style={styles.input}
          ref={lastNameInputRef}
          onChangeText={onChangeLastName}
          value={lastName}
          autoCapitalize="words"
          placeholder="Tremblay"
          keyboardType="default"
          autoComplete="name"
          returnKeyType="next"
          onSubmitEditing={() => usernameInputRef.current?.focus()}
          placeholderTextColor={"#A1A1A1"}
          onFocus={() => {
  setTimeout(() => {
    emailInputRef.current?.measureLayout(
      scrollViewRef.current as any,
      (x, y) => {
        scrollViewRef.current?.scrollTo({ y: y - 250, animated: true });
      }
    );
  }, 100);
}}
        />

        

    <Text style={styles.textForm}>
          <Text >
            Nom d'utilisateur
          </Text>
          <Text style={{color: "#ff0000", fontSize: 19, fontWeight: "400"}}> *</Text>
        </Text>

      <TextInput
          style={styles.input}
          ref={usernameInputRef}
          onChangeText={onChangeUsername}
          value={username}
          placeholder="nomutilisateur"
          keyboardType="default"
          autoComplete="username"
          returnKeyType="next"
          onSubmitEditing={() => emailInputRef.current?.focus()}
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

        


      <Text style={styles.textForm}>
            <Text >
              Adresse e-mail
            </Text>
            <Text style={{color: "#ff0000", fontSize: 19, fontWeight: "400"}}> *</Text>
          </Text>

      <TextInput
          style={styles.input}
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

        {/** 

        <Text style={styles.textForm}>
              <Text >
                Numéro de matricule
              </Text>
              <Text style={{color: "#ff0000", fontSize: 19, fontWeight: "400"}}> *</Text>
            </Text>

      <TextInput
          style={styles.input}
          ref={matriculeInputRef}
          onChangeText={(text) => onChangeMatricule(text)}
          value={matricule !== null ? matricule.toString() : ''}
          placeholder="12345678"
          keyboardType="numeric"
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
      */}

      <Text style={isPassword ? styles.textForm : styles.textFormR}>
            <Text >
              Mot de passe
            </Text>
            <Text style={{color: "#ff0000", fontSize: 19, fontWeight: "400"}}> *</Text>
          </Text>
  <View>
      <TextInput
          style={isPassword ? styles.input : styles.inputR}
          ref={passwordInputRef}
          onChangeText={onChangePassword}
          onChange={(e) => validatePassword(e.nativeEvent.text)}
          value={password}
          placeholder="********"
          keyboardType="default"
          autoComplete="password"
          returnKeyType="next"
          onSubmitEditing={() => passwordConfInputRef.current?.focus()}
          placeholderTextColor={"#A1A1A1"}
          secureTextEntry={isVisible}
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
          style={styles.showPasswordButton}
          onPress={() => setIsVisible(!isVisible)}
        >
          <Ionicons 
            name={isVisible ? 'eye-off' : 'eye'} 
            size={24} 
            color="#A1A1A1" 
          />
        </TouchableOpacity>
        </View>

        <Text style={styles.validateText}>
          <Text >
            Le mot de passe doit contenir :
          </Text>
          {"\n"}
         <Text style={{color: isLengthValid ? "#00AA00" : "#FF0000"}}>- 6 characteres </Text>
         {"\n"}
         <Text style={{color : isUppercaseValid ? "#00AA00" : "#FF0000"}} >- 1 majuscule </Text>
         {"\n"}
          <Text style={{color : isNumberValid ? "#00AA00" : "#FF0000"}}>- 1 chiffre </Text>
          {"\n"}
          <Text style={{color : isSpecialCharValid ? "#00AA00" : "#FF0000"}}>- 1 caractère spécial (Exemple : !@#$%*&...)</Text>
          {"\n"}
        </Text>



        <Text style={isPassword ? styles.textForm : styles.textFormR}>
            <Text >
              Confirmer le mot de passe
            </Text>
            <Text style={{color: "#ff0000", fontSize: 19, fontWeight: "400"}}> *</Text>
          </Text>

      <View>
      <TextInput
          style={isPassword ? styles.input : styles.inputR}
          ref={passwordConfInputRef}
          onChangeText={onChangePasswordConf}
          value={passwordConf}
          placeholder="********"
          keyboardType="default"
          autoComplete="password"
          returnKeyType="done"
          placeholderTextColor={"#A1A1A1"}
          onSubmitEditing={() => {
            checkMatch(password, passwordConf);
          }}
          secureTextEntry={isVisibleConfirm}
          onFocus={() => {
  setTimeout(() => {
    passwordConfInputRef.current?.measureLayout(
      scrollViewRef.current as any,
      (x, y) => {
        scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
      }
    );
  }, 100);
}}

        />

        {!isPassword && (
          <Text style={styles.validateTextR}>
            Les mots de passe ne correspondent pas.
          </Text>
        )}

        <TouchableOpacity 
          style={styles.showPasswordButton}
          onPress={() => setIsVisibleConfirm(!isVisibleConfirm)}
        >
          <Ionicons 
            name={isVisibleConfirm ? 'eye-off' : 'eye'} 
            size={24} 
            color="#A1A1A1" 
          />
        </TouchableOpacity>
        </View>


      


      <View style={styles.buttonView}>
      <Button onPress={() => debug()}>S'inscrire</Button>
      </View>
      <Button onPress={() => router.push("/sign-in")} type="secondary">Déjà un compte ?</Button>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );


}

const styles = {
  container: {
    flex: 1,
  },
  backButton: {
    position: "absolute" as const,
    top: 10,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
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
  textFormR: {
    textAlign: "left" as const,
    paddingLeft: 30,
    color : "#FF0000",
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
    color: "#000000",
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
    color: "#000000",
  },
  buttonView:{
    marginTop: -10,
    padding:20
  },
  validateText: {
    textAlign: "left" as const,
    paddingLeft: 30,
    color: "#A1A1A1",
  },
  validateTextR: {
    textAlign: "left" as const,
    paddingLeft: 30,
    color: "#FF0000",

  },
  showPasswordButton: {
    position: "absolute" as const,
    right: 30,
    top: 13,
    padding: 5
  }
  
}

