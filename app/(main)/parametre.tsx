import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Modal,
  Button,
  TextInput,
  ScrollView,
  StatusBar,
  Switch
} from "react-native";

import React, { useState } from 'react'
import ScrollableLayout from "@/components/layouts/ScrollableLayout";
import {
  ChevronRight,
  Package,
  Bell,
  Settings2,
  HelpCircle,
  Info,
  Eye,
  EyeOff,
} from "lucide-react-native";
import COLORS from "@/constants/Colors";
import SPACING from "@/constants/Spacing";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import TYPOGRAPHY from "@/constants/Typography";
import Divider from "@/components/common/Divider";
import AntDesign from '@expo/vector-icons/AntDesign';  // icone de Instagram
import FontAwesome from '@expo/vector-icons/FontAwesome'; // icone de user-secret 
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { clearTokens, getInfoFromToken, getToken, deleteAccount} from "@/utils/tokenStorage";

// Menu item interface for type safety
interface MenuItem {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export default function ParametreScreen() {
  
  const navigation = useRouter();
  const [notifModal,setNotifModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [prferencesModalVisible, setPreferencesModalVisible] = useState(false);
  const [userImage, setUserImage] = React.useState<string | null>(null);
  const [userFullName, setUserFullName] = React.useState<string>("");
  const [userProfilePicture, setUserProfilePicture] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [userEmail, setUserEmail] = React.useState<string>("");
  
  // Preference states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [promotionsEnabled, setPromotionsEnabled] = useState(true);
  const [updatesEnabled, setUpdatesEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [languagePreference, setLanguagePreference] = useState('french');

  const orders = [
    {
      id: 1,
      image: 'https://placehold.jp/150x150.png',
      title: 'Commande #XXX',
      content: 'Trucs que t\'as acheté',
      restaurant: 'Jean Brillant',
      price: '$20.00',
    },
    {
      id: 2,
      image: 'https://placehold.jp/150x150.png',
      title: 'Commande #XXX',
      content: 'Trucs que t\'as acheté',
      restaurant: 'André Aisenstadt',
      price: '$15.00',
    },
    // Add more orders as needed
  ];
  

  React.useEffect(() => {
      const getUserInfo = async () => {
        try {
          // Get the access token
          const accessToken = await getToken();
          
          if (accessToken) {
            // Get user info from token
            const userInfo = await getInfoFromToken(accessToken);
            console.log("User Info from token:", userInfo);
            
            // Set the full name (first name + last name)
            if (userInfo && userInfo.first_name && userInfo.last_name) {
              setUserFullName(`${userInfo.first_name} ${userInfo.last_name}`);
              setUserImage(userInfo.photo_url);
              setUserEmail(userInfo.email);
            } else if (userInfo && userInfo.name) {
              // Fallback to name field if first_name/last_name aren't available
              setUserFullName(userInfo.name);
            } else if (userInfo && userInfo.username) {
              // Fallback to username if no name fields are available
              setUserFullName(userInfo.username);
            } else {
              setUserFullName("Utilisateur");
            }
  
  
  
          } else {
            console.log("No access token found");
            setUserFullName("Utilisateur");
          }
        
        } catch (error) {
          console.error("Error getting user info from token:", error);
          setUserFullName("Utilisateur");
        } finally {
          setIsLoading(false);
        }
      };
  
      getUserInfo();
    }, []);

  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const logoutfromthis = async () => {
    // Clear all tokens and user data
    await clearTokens();
    console.log('Logged out - cleared all tokens and user data');
    setAccountModalVisible(false);
    navigation.push("/first-onboarding");
  };

  const deletethisaccount = async () =>{

    const token = await getToken();
    if (token) {
      const isDeleted = await deleteAccount(token);
      if (isDeleted) {
        setAccountModalVisible(false);
        navigation.push("/first-onboarding");
      } else {
        alert("Erreur lors de la suppression du compte. Veuillez réessayer plus tard.");
      }
    }
    else {
      alert("Vous devez être connecté pour supprimer votre compte.");
    }
  setAccountModalVisible(false);

    
  }


  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const fetchOrders = async () => {
    try {
      const token = await getToken();
      
      // Don't fetch if no token (user logged out)
      if (!token) {
        console.log('No token available, skipping orders fetch');
        return [];
      }

      const response = await fetch('https://cafesansfil-api-r0kj.onrender.com/api/users/@me/orders', {
        method: 'GET',
        headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Don't throw error, just log it and return empty array
        console.log(`Failed to fetch orders: ${response.status}`);
        return [];
      }

      const ordersData = await response.json();
      console.log("Orders Data: ", ordersData);
      return ordersData;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  // Only fetch orders if component is mounted and user is logged in
  React.useEffect(() => {
    fetchOrders();
  }, []);
  // Menu items data with their respective icons and actions
  const menuItems: MenuItem[] = [
    /*
    {
      icon: <Package size={26} strokeWidth={2.5} color={COLORS.black} />,
      title: "Mes commandes",
      subtitle: "Consultez vos commandes et transactions passées.",
      onPress:() => setOrdersModalVisible(true),
    },
    */
    {
      icon: <Settings2 size={26} strokeWidth={2.5} color={COLORS.black} />,
      title: "Mes préférences",
      subtitle: "Gérez et personnalisez vos préférences.",
      onPress: () => setPreferencesModalVisible(true),
    },
    /*
    {
      icon: <HelpCircle size={26} strokeWidth={2.5} color={COLORS.black} />,
      title: "Aide et support",
      subtitle: "Obtenez de l'aide et contactez le support.",
      onPress: () => console.log("Support pressed"),
    },
    */
    {
      icon: <Info size={26} strokeWidth={2.5} color={COLORS.black} />,
      title: "À propos",
      subtitle: "En savoir plus sur nous et notre mission.",
      onPress: () => setModalVisible(true),
    },
  ];

  // Render a single menu item
  const renderMenuItem = ({ icon, title, subtitle, onPress }: MenuItem) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} key={title}>
      <View style={styles.menuItemLeft}>
        {icon}
        <View style={styles.menuItemText}>
          <Text style={[TYPOGRAPHY.body.large.semiBold, styles.menuItemTitle, { fontSize: 15 }]}>
            {title}
          </Text>
          <Text style={[TYPOGRAPHY.body.small.base, styles.menuItemSubtitle,  { fontSize: 10.6 }]}>
            {subtitle}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
    <StatusBar />
    {/* User Profile Section */}
    <TouchableOpacity style={styles.profileSection} onPress={() => setAccountModalVisible(true)}>
    <View style={styles.profileLeft}>
      <Image
        source={{ uri: userImage } as any} 
        style={styles.profileImage}
      />
      <View style={styles.profileInfo}>
        <Text
          style={[TYPOGRAPHY.heading.small.bold, styles.profileName]}
        >
          {isLoading ? "Chargement..." : userFullName}
          {}
        </Text>
        <Text
          style={[TYPOGRAPHY.body.small.base, styles.profileSubtitle,  { fontSize: 11 }]}
        >
          Gérez les informations de votre compte.
        </Text>
      </View>
    </View>
    <ChevronRight size={24} color={COLORS.black} strokeWidth={2.5} />
  </TouchableOpacity>
    <ScrollableLayout>
      <SafeAreaView style={styles.container}>

        

        {/* Menu Items */}
        <View style={styles.menuSection}>{menuItems.map(renderMenuItem)}</View>

        <Divider marginTop={16} marginBottom={4}></Divider>

        {/* System Status */}
        <View style={styles.systemStatus}>
          <Text style={[TYPOGRAPHY.body.normal.semiBold, styles.systemStatusTitle]}>
            État du système
          </Text>
          <View style={styles.systemStatusIndicator}>
            <View style={{ position: 'relative' }}>
              <Animated.View
                style={[
                  styles.pulsingDot,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              <View style={styles.statusDot} />
            </View>
            <Text style={[TYPOGRAPHY.body.small.bold, styles.systemStatusText]}>
              Opérationnel
            </Text>
          </View>
          <Text style={[TYPOGRAPHY.body.small.base, styles.systemStatusSubtext]}>
            Le système fonctionne correctement.
          </Text>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={accountModalVisible}
          onRequestClose={() => setAccountModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Mon compte</Text>
                <TouchableOpacity onPress={() => setAccountModalVisible(false)}>
                  <AntDesign name="close" size={24} color={COLORS.black} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalContent}>
                <TouchableOpacity>
                  <Image source={{ uri: userProfilePicture || undefined }} style={styles.profilePicture} />
                </TouchableOpacity>
                <Text style={[{alignSelf:'center',padding:20, fontWeight:500}]}>Modifier votre photo de profil</Text>
                <TextInput style={styles.input } placeholder="Modifier  Nom" placeholderTextColor="grey" defaultValue={userFullName} />
                <TextInput style={styles.input} placeholder="Modifier votre Email" placeholderTextColor="grey" defaultValue={userEmail}/>
                
                <View style={styles.passwordContainer}>
                  <TextInput 
                    style={styles.passwordInput} 
                    placeholder="Modifier votre Mot de passe" 
                    secureTextEntry={!showPassword} 
                    placeholderTextColor="grey"
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
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => { deletethisaccount()}}>
                    <Text style={styles.deleteButtonText}>Supprimer votre compte</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.logoutButton} onPress={async () => { logoutfromthis() }}>
                    <Text style={styles.logoutButtonText}>Se Déconnecter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modernModalTitle}>À propos</Text>
        <TouchableOpacity onPress={() => setModalVisible(false)}>
          <AntDesign name="close" size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.modernModalContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.aboutSection}>
          <View style={styles.sectionIcon}>
            <Info size={24} color={COLORS.black} />
          </View>
          <Text style={styles.sectionTitle}>Bienvenue!</Text>
          <Text style={styles.sectionContent}>
            Avez-vous déjà rêvé d'utiliser une application mobile pour pouvoir commander un bon repas? 
            C'est exactement ce qui a poussé notre équipe à créer une application de ce type. 
            Notre club, du nom de CADUM, est justement à la charge de cela. Ce club vise à développer des applications mobiles pour améliorer la vie des étudiants des différentes universités. 
            Si vous avez tendance à avoir le manque d'énergie de tout le temps commander de la nourriture, nous sommes justement là pour vous. Soyez la bienvenue!
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.aboutSection}>
          <View style={styles.sectionIcon}>
            <FontAwesome name="users" size={22} color={COLORS.black} />
          </View>
          <Text style={styles.sectionTitle}>Club</Text>
          <Text style={styles.sectionContent}>
            L'idée de ce club est venue en hiver 2024. Les étudiants de l'Université de Montréal dans le programme d'informatique voulaient appliquer leurs connaissances acquises dans les cours d'informatique dans la vie réelle.
            Pour cela, ils ont voulu créer un club sur le développement d'applications mobiles pour s'ouvrir à des technologies de pointe.
            Grâce à cela, l'idée a été mise au point en automne 2024. À l'automne 2024, les étudiants ont décidé de développer une application mobile sur la commande de repas à partir des cafétérias de votre université.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.aboutSection}>
          <View style={styles.sectionIcon}>
            <FontAwesome6 name="discord" size={22} color={COLORS.black} />
          </View>
          <Text style={styles.sectionTitle}>Réseaux sociaux</Text>
          <Text style={styles.sectionContent}>
            Comme toute autre compagnie, nous sommes aussi présents sur les réseaux sociaux. Là-bas, vous pouvez suivre toutes les nouvelles dont des activités et même des nouveautés sur l'application mobile en soi.
            Les réseaux sociaux que nous sommes présents sont Instagram et Discord. Cependant, si vous voulez voir les nouveautés qui viennent de sortir, allez sur Discord. N'oubliez pas d'activer les notifications pour d'autres types de nouveautés.
          </Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome6 name="discord" size={24} color="black" onPress={() => 
              navigation.push("https://discord.gg/DvJWz9hwWF")}/>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <AntDesign name="github" size={24} color="black" onPress={() => 
              navigation.push("https://github.com/CADUM-UdeM")}/>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={() => 
              navigation.push("https://cadum.aediroum.ca")}>
              <FontAwesome name="globe" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.aboutSection}>
          <View style={styles.sectionIcon}>
            <FontAwesome name="user-secret" size={22} color={COLORS.black} />
          </View>
          <Text style={styles.sectionTitle}>Politiques et confidentalité</Text>
          <Text style={styles.sectionContent}>
            En termes de politique et de confidentalité, nous respectons la vie privée de chaque individu. Donc, les informations personnelles comme les mots de passe sont confidentielles. 
            Aucun utilisateur peut avoir accès aux informations personnelles de d'autres utilisateurs et même chose avec les développeurs de l'application mobile. 
            En cas de fuites de données ou de piratage de votre compte, veuillez nous contacter immédiatement.
          </Text>
        </View>
        
        <View style={styles.footerSection}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 CADUM. Tous droits réservés.</Text>
        </View>
      </ScrollView>
    </View>
  </View>
</Modal>

<Modal
  animationType="slide"
  transparent={true}
  visible={prferencesModalVisible}
  onRequestClose={() => setPreferencesModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modernModalTitle}>Mes préférences</Text>
        <TouchableOpacity onPress={() => setPreferencesModalVisible(false)}>
          <AntDesign name="close" size={24} color={COLORS.black} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.modernModalContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <View style={styles.preferenceSection}>
          <View style={styles.preferenceSectionHeader}>
            <View style={styles.sectionIcon}>
              <Bell size={20} color={COLORS.black} />
            </View>
            <Text style={styles.preferenceSectionTitle}>Notifications</Text>
          </View>
          <Text style={styles.preferenceSectionDescription}>
            Gérez vos préférences de notification pour rester informé
          </Text>
          
          <View style={styles.toggleContainer}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Toutes les notifications</Text>
                <Text style={styles.toggleSubtitle}>Activer/désactiver toutes les notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E0E0E0', true: '#25c800ff' }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>

            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Promotions</Text>
                <Text style={styles.toggleSubtitle}>Recevez les offres spéciales</Text>
              </View>
              <Switch
                value={promotionsEnabled}
                onValueChange={setPromotionsEnabled}
                trackColor={{ false: '#E0E0E0', true: '#25c800ff' }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor="#E0E0E0"
                disabled={!notificationsEnabled}
              />
            </View>

            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Mises à jour</Text>
                <Text style={styles.toggleSubtitle}>Nouvelles fonctionnalités et améliorations</Text>
              </View>
              <Switch
                value={updatesEnabled}
                onValueChange={setUpdatesEnabled}
                trackColor={{ false: '#E0E0E0', true: '#25c800ff' }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor="#E0E0E0"
                disabled={!notificationsEnabled}
              />
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Theme Section */}
        <View style={styles.preferenceSection}>
          <View style={styles.preferenceSectionHeader}>
            <View style={styles.sectionIcon}>
              <Settings2 size={20} color={COLORS.black} />
            </View>
            <Text style={styles.preferenceSectionTitle}>Apparence</Text>
          </View>
          <Text style={styles.preferenceSectionDescription}>
            Personnalisez l'apparence de l'application
          </Text>
          
          <View style={styles.toggleContainer}>
            <View style={styles.toggleItem}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Mode sombre</Text>
                <Text style={styles.toggleSubtitle}>Activez le thème sombre pour réduire la fatigue oculaire</Text>
              </View>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#E0E0E0', true: '#25c800ff' }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Language Section */}
        <View style={styles.preferenceSection}>
          <View style={styles.preferenceSectionHeader}>
            <View style={styles.sectionIcon}>
              <FontAwesome name="globe" size={20} color={COLORS.black} />
            </View>
            <Text style={styles.preferenceSectionTitle}>Langue</Text>
          </View>
          <Text style={styles.preferenceSectionDescription}>
            Sélectionnez votre langue préférée
          </Text>
          
          <View style={styles.languageContainer}>
            <TouchableOpacity 
              style={[
                styles.languageOption,
                languagePreference === 'french' && styles.languageOptionSelected
              ]}
              onPress={() => setLanguagePreference('french')}
            >
              <View style={styles.languageOptionContent}>
                <Text style={[
                  styles.languageText,
                  languagePreference === 'french' && styles.languageTextSelected
                ]}>
                  🇫🇷 Français
                </Text>
                {languagePreference === 'french' && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.languageOption,
                languagePreference === 'english' && styles.languageOptionSelected
              ]}
              onPress={() => setLanguagePreference('english')}
            >
              <View style={styles.languageOptionContent}>
                <Text style={[
                  styles.languageText,
                  languagePreference === 'english' && styles.languageTextSelected
                ]}>
                  🇬🇧 English
                </Text>
                {languagePreference === 'english' && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.languageOption,
                languagePreference === 'spanish' && styles.languageOptionSelected
              ]}
              onPress={() => setLanguagePreference('spanish')}
            >
              <View style={styles.languageOptionContent}>
                <Text style={[
                  styles.languageText,
                  languagePreference === 'spanish' && styles.languageTextSelected
                ]}>
                  🇪🇸 Español
                </Text>
                {languagePreference === 'spanish' && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  </View>
</Modal>
        
        
        <Modal
          animationType="slide"
          transparent={true}
          visible={ordersModalVisible}
          onRequestClose={() => setOrdersModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Mes Commandes</Text>
                <TouchableOpacity onPress={() => setOrdersModalVisible(false)}>
                  <AntDesign name="close" size={24} color={COLORS.black} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalContent}>
              {orders.map((order) => (
                <TouchableOpacity key={order.id} style={styles.orderBox} onPress={() => {}}>
                  <Image source={{ uri: order.image }} style={styles.orderImage} />
                  <View style={styles.orderDetails}>
                    <Text style={styles.orderTitle}>{order.title}</Text>
                    <Text style={styles.orderContent}>{order.content}</Text>
                    <Text style={styles.orderRestaurant}>{order.restaurant}</Text>
                  </View>
                  <Text style={styles.orderPrice}>{order.price}</Text>
                </TouchableOpacity>
              ))}
              </View>
            </View>
          </View>
        </Modal>

        
      </SafeAreaView>
    </ScrollableLayout></>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderTopColor: COLORS.white,
    backgroundColor: COLORS.white,
    paddingTop: SPACING["8xl"], 
    paddingHorizontal: SPACING.md,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  profileImage: {
    width: SPACING["9xl"],
    height: SPACING["9xl"],
    borderRadius: 100,
    borderWidth: 4,
    // borderColor: "rgba(0, 0, 0, 0.1)", // Not from any university
    borderColor: "rgba(0, 87, 172, .2)", // From University of Montreal
    // borderColor: "rgba(237, 27, 47, .2)", // From McGill University
  },
  profileInfo: {
    gap: SPACING.xxs,
  },
  profileName: {
    color: COLORS.black,
  },
  profileSubtitle: {
    color: COLORS.subtuleDark,
  },
  menuSection: {
    gap: 0,
    marginHorizontal: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,

  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  menuItemText: {
    gap: 5,
  },
  menuItemTitle: {
    color: COLORS.black,
  },
  menuItemSubtitle: {
    color: COLORS.subtuleDark,
  },
  systemStatus: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  systemStatusTitle: {
    color: COLORS.black,
  },
  systemStatusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.status.green,
    position: 'relative',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.status.green,
    position: 'absolute',
    opacity: 0.5,
  },
  systemStatusText: {
    color: COLORS.status.green,
  },
  systemStatusSubtext: {
    color: COLORS.subtuleDark,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '100%',
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: '20%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
  },
  input: {
    height: 45,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  btn: {
    borderRadius: 15,
    margin: 10,
    width: '60%',
    alignSelf: 'center',
  },
  orderBox :{
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  orderImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
  },
  orderDetails: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderRestaurant: {
    fontSize: 14,
    color: '#999',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clubText: {
    fontSize: 17, // taille de texte plus grande
    fontFamily: 'Arial', // police Calibri
    textAlign: 'justify',
    padding: 5,
  },
  socialText: {
    fontSize: 17,
    fontFamily: 'Arial',
    textAlign: 'justify',
    padding: 5,
  },
  policyText: {
    fontSize: 17,
    fontFamily: 'Arial',
    textAlign: 'justify',
    padding: 5,
  },  
  boldText: {
    fontSize: 21,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    lineHeight: 45,
    color: '#000033', // peut etre repeter cette couleur dans les autres parties
  },
  textContainer: {
    margin: 10,
    borderColor: "black",
    borderWidth: 1,
    borderRadius:10,
  },
  // Additional styles for the modern modal
modernModalContainer: {
  width: '100%',
  maxHeight: '90%',
  backgroundColor: '#fff',
  borderRadius: 20,
  overflow: 'hidden',
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 10,
  },
  shadowOpacity: 0.25,
  shadowRadius: 15,
  elevation: 10,
},
modernModalTitle: {
  fontSize: 22,
  fontWeight: '700',
  color: COLORS.black,
},
modernModalContent: {
  padding: 20,
},
aboutSection: {
  marginBottom: 25,
},
sectionTitle: {
  fontSize: 18,
  fontWeight: '600',
  marginBottom: 12,
  color: COLORS.black,
},
sectionContent: {
  fontSize: 15,
  lineHeight: 24,
  color: '#555',
},
sectionIcon: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(0, 87, 172, 0.1)', // UdeM blue with transparency
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 15,
},
divider: {
  height: 1,
  backgroundColor: '#f0f0f0',
  marginVertical: 20,
},
socialIcons: {
  flexDirection: 'row',
  marginTop: 15,
  gap: 15,
  justifyContent: 'center',
  
},
socialButton: {
  width: 45,
  height: 45,
  borderRadius: 22.5,
  backgroundColor: 'rgba(0, 87, 172, 0.1)', // UdeM blue with transparency
  
  alignItems: 'center',
  justifyContent: 'center',
},
footerSection: {
  marginTop: 20,
  alignItems: 'center',
  paddingVertical: 15,
},
versionText: {
  fontSize: 14,
  color: '#999',
  marginBottom: 5,
},
copyrightText: {
  fontSize: 12,
  color: '#999',
  marginBottom: SPACING["md"],
},
// Preferences Modal Styles
preferenceSection: {
  marginBottom: 24,
},
preferenceSectionHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
  gap: 10,
},
preferenceSectionTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: COLORS.black,
  marginTop : -14
  
},
preferenceSectionDescription: {
  fontSize: 14,
  color: '#666',
  marginBottom: 16,
  lineHeight: 20,
},
toggleContainer: {
  backgroundColor: '#F8F9FA',
  borderRadius: 12,
  padding: 4,
},
toggleItem: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 14,
  paddingHorizontal: 16,
  backgroundColor: 'white',
  borderRadius: 10,
  marginBottom: 4,
},
toggleTextContainer: {
  flex: 1,
  marginRight: 12,
},
toggleTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: COLORS.black,
  marginBottom: 4,
},
toggleSubtitle: {
  fontSize: 13,
  color: '#666',
  lineHeight: 18,
},
languageContainer: {
  gap: 8,
},
languageOption: {
  backgroundColor: '#f8faf8ff',
  borderRadius: 12,
  padding: 16,
  borderWidth: 2,
  borderColor: 'transparent',
},
languageOptionSelected: {
  backgroundColor: 'rgba(0, 172, 34, 0.08)',
  borderColor: '#1dac00ff',
},
languageOptionContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
languageText: {
  fontSize: 16,
  fontWeight: '500',
  color: '#333',
},
languageTextSelected: {
  color: '#1dac00ff',
  fontWeight: '600',
},
checkmark: {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: '#1dac00ff',
  alignItems: 'center',
  justifyContent: 'center',
},
checkmarkText: {
  color: 'white',
  fontSize: 14,
  fontWeight: 'bold',
},
buttonContainer: {
  marginTop: 20,
  gap: 12,
},
deleteButton: {
  backgroundColor: '#FF4444',
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 24,
  shadowColor: '#FF4444',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 4,
},
deleteButtonText: {
  color: 'white',
  textAlign: 'center',
  fontSize: 16,
  fontWeight: '600',
},
logoutButton: {
  backgroundColor: 'white',
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 24,
  borderWidth: 1.5,
  borderColor: '#E0E0E0',
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 1,
  },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
logoutButtonText: {
  color: '#333',
  textAlign: 'center',
  fontSize: 16,
  fontWeight: '600',
},
passwordContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f0f0f0',
  borderRadius: 10,
  marginBottom: 12,
  paddingHorizontal: 8,
  height: 45,
},
passwordInput: {
  flex: 1,
  height: '100%',
  color: '#000',
},
passwordToggle: {
  padding: 4,
  justifyContent: 'center',
  alignItems: 'center',
},
});
