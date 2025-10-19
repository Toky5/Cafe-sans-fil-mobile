import { Button, Modal, StyleSheet, TouchableOpacity, View, ScrollView ,Text, TouchableHighlight,Animated, Platform } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, Tabs, useRouter } from "expo-router";

import {Swipeable} from "react-native-gesture-handler";

import SPACING from "@/constants/Spacing";
import COLORS from "@/constants/Colors";
import Ionicons from '@expo/vector-icons/Ionicons';
import { GestureHandlerRootView } from "react-native-gesture-handler"; // Import GestureHandlerRootView
import {getExpoPushToken} from '@/utils/notifications';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';


import {
  ChevronRight,
  Package,
  Bell,
  Settings2,
  HelpCircle,
  Info,
} from "lucide-react-native";
import AccountInfo from "@/components/common/Auth/AccountInfo";
import React, { useState , useRef, use, useEffect} from "react";
import { AntDesign } from "@expo/vector-icons";
// FIXME: Replace with actual user data. This is just a placeholder.
export const user = {
  fullName: "Darlene Robertson",
  profilePicture: require("../../assets/images/placeholder/ProfilePicture.png"),
};

type HeaderLayoutProps = {
  fullName?: string;
  profilePicture?: any;
};

type Notification = {
  id: number;
  title: string;
  content: string;
  status: boolean;
};

/**
 * HeaderLayout component that renders a header layout with account info and icon button.
 */
export default function HeaderLayout({fullName, profilePicture}: HeaderLayoutProps) {
  
  const navigation = useRouter();
  const [notifModal, setNotifModal] = useState(false);
  const [displayToken, setDisplayToken] = useState("");
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  
  useEffect(() => {
    const loadToken = async () => {
      try {
        setIsLoadingToken(true);
        
        // This will wait for initialization if needed, or return cached token
        const token = await getExpoPushToken();
        
        if (token) {
          setDisplayToken(token);
        } else {
          setDisplayToken("Aucune notification");
        }
      } catch (error) {
        console.error("Error loading token:", error);
        setDisplayToken("Aucune notification");
      } finally {
        setIsLoadingToken(false);
      }
    };
    loadToken();
  }, []);


  const handleDelete = (id : any) => {
    setNotifs(notifs.filter((notif) => notif.id !== id));
    const swipeableRef = swipeableRefs.current.get(id);
    if (swipeableRef) {
      swipeableRef.close();
    }
  };

  const handleUpdate = (id : any) => {
    setNotifs(
      notifs.map((notif) =>
        notif.id === id ? { ...notif, status: !notif.status } : notif
      )
    );
    const swipeableRef = swipeableRefs.current.get(id);
    if (swipeableRef) {
      swipeableRef.close();
    }
  };
  const swipeableRefs = useRef(new Map());
  const renderRightActions = (dragX : any, id : any) => {
    const opacity = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const translateX = dragX.interpolate({
      inputRange: [-10, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.deleteButton, { opacity, transform: [{ translateX }] }]}>
        <TouchableOpacity onPress={() => handleDelete(id)}>
          <Text style={styles.deleteButtonText}>Effacer</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  const renderLeftActions = (dragX : any, id : any) => {
    const opacity = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.toggleButton, { opacity }]}>
        <TouchableOpacity onPress={() => handleUpdate(id)}>
            <Text style={styles.toggleButtonText}>
            {notifs.find((notif) => notif.id === id)?.status ? "Marquer comme non lu" : "Marquer comme lu"}
            </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  /*
  const [notifs, setNotifs] = useState([
      {
        id: 1,
        title: 'Titre notification #XXX',
        content: 'Contenu de la notification',
        status: true,
      },
      {
        id: 2,
        title: 'Titre notification #XX2',
        content: 'Contenu de la notification',
        status: false,
      },
      {
        id: 3,
        title: 'Titre notification #XX1',
        content: 'Contenu de la notification',
        status: false,
      },
      // Add more notifications as needed
    ]);
    */
    // a desac pr le test
    const [notifs, setNotifs] = useState<Notification[]>([]);
    
    const handleReadAll = () => {
      setNotifs(notifs.map((notif) => ({ ...notif, status: true })));
    };
    const unreadCount = notifs.filter((notif) => !notif.status).length;
  return (
    <SafeAreaView style={styles.headerContainer} testID="header-container">
      <AccountInfo
        profilePicture={user.profilePicture}
        profileName={user.fullName}
      />
      <View style={{ position: 'relative' }}>
          <Bell size={26} strokeWidth={2.5} color={COLORS.black} onPress={() => setNotifModal(true)} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      <Modal
        animationType="slide"
        visible={notifModal}
        presentationStyle="pageSheet"
        onRequestClose={() => setNotifModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mes Notifications</Text>
              <TouchableOpacity 
                      onPress={() => setNotifModal(false)} 
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <AntDesign name="close" size={24} color={COLORS.black} />
                    </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
            {/* Token Display Section */}
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenLabel}>Expo Push Token:</Text>
              {isLoadingToken ? (
                <Text style={styles.tokenText}>Chargement...</Text>
              ) : (
                <>
                  <Text style={styles.tokenText} numberOfLines={1} ellipsizeMode="middle">
                    {displayToken}
                  </Text>
                  {displayToken !== "Aucune notification" && (
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={async () => {
                        await Clipboard.setStringAsync(displayToken);
                      }}
                    >
                      <Text style={styles.copyButtonText}>Copier</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* Notifications List */}
            {notifs.length === 0 ? (
                  <View>
                    <Text style={styles.noNotificationsText}>Aucune notification disponible</Text>
                  </View>
                ) : (
              notifs.map((notif) => (
                <GestureHandlerRootView key={notif.id} style={{ width: '100%', marginBottom: 12 }}>
                  <Swipeable
                    renderLeftActions={(progress, dragX) => renderLeftActions(dragX, notif.id)}
                    renderRightActions={(progress, dragX) => renderRightActions(dragX, notif.id)}
                    ref={(ref) => {
                      if (ref) {
                        swipeableRefs.current.set(notif.id, ref);
                      }
                    }}
                  >
                    <View style={styles.orderBox}>
                      <View style={styles.orderDetails}>
                        <Text style={styles.orderTitle}>{notif.title}</Text>
                        <Text style={styles.orderContent}>{notif.content}</Text>
                        <View style={{ position: 'absolute', right: 10, top: '50%', transform: [{ translateY: -5 }] }}>
                          <View style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: notif.status ? 'green' : 'red',
                          }} />
                        </View>
                      </View>
                    </View>
                  </Swipeable>
                </GestureHandlerRootView>
              )))}
              
            </ScrollView>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.readAllButton} onPress={handleReadAll}>
              <Text style={styles.readAllButtonText}>✓</Text>
              </TouchableOpacity>
            )}
          </View>
          
        </View>
        
        
      </Modal>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: "center",
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingTop: SPACING.xs, 
    paddingBottom: -SPACING.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    justifyContent: "space-between",
    borderBottomColor: COLORS.lightGray,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.white,
  

  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding:20,
    marginTop: Platform.OS === 'android' ? 40 : 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  orderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.black ,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButton :{
    padding: 10,
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
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '85%',
    borderTopRightRadius:12,
    borderBottomRightRadius:12
  },
  toggleButton: {
    backgroundColor: 'yellow',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '85%',
    borderTopLeftRadius:12,
    borderBottomLeftRadius:12
  },
  toggleButtonText: {
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.black ,
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  noNotificationsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  readAllButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'green',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  readAllButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  tokenContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.black,
  },
  tokenText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  copyButton: {
    backgroundColor: COLORS.black,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  copyButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
