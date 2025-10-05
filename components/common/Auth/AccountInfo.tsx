import { Image, Text, View, StyleSheet, TouchableOpacity } from "react-native";

import COLORS from "@/constants/Colors";
import SPACING from "@/constants/Spacing";
import TYPOGRAPHY from "@/constants/Typography";
import React from "react";
import { useRouter } from "expo-router";
import { getUserFullname, getUserPhotoUrl, setUserPhotoUrl, getInfoFromToken, getToken } from "@/utils/tokenStorage";
import { user } from "@/components/layouts/HeaderLayout";


type AccountInfoProps = {
  title?: string;
  profileName?: string;
  profilePicture?: any;
};

export default function AccountInfo({
  title = "Bonjour et bienvenue",
  profileName,
  profilePicture,
}: AccountInfoProps) {
  const [userImage, setUserImage] = React.useState<string | null>(null);
  const [userFullName, setUserFullName] = React.useState<string>("");
  const [userProfilePicture, setUserProfilePicture] = React.useState<string | null>(profilePicture || null);
  const [isLoading, setIsLoading] = React.useState(true);
  const navigation = useRouter();

  React.useEffect(() => {
    const getUserInfo = async () => {
      try {
        // Get the stored full name from storage
        const storedFullName = await getUserFullname();
        
        if (storedFullName) {
          setUserFullName(storedFullName);
          console.log("User full name from storage:", storedFullName);
        } else {
          console.log("No stored full name found");
          setUserFullName("Utilisateur");
        }

        // Get the stored photo URL from storage
        const storedPhotoUrl = await getUserPhotoUrl();
        
        if (storedPhotoUrl) {
          setUserImage(storedPhotoUrl);
          console.log("User photo URL from storage:", storedPhotoUrl);
        } else {
          console.log("No stored photo URL found");
          // Fallback: try to fetch from server if not in storage
          const accessToken = await getToken();
          if (accessToken) {
            const userInfo = await getInfoFromToken(accessToken);
            if (userInfo && userInfo.photo_url) {
              setUserImage(userInfo.photo_url);
              // Store it for next time
              await setUserPhotoUrl(userInfo.photo_url);
            }
          }
        }
      
      } catch (error) {
        console.error("Error getting user info:", error);
        setUserFullName("Utilisateur");
      } finally {
        setIsLoading(false);
      }
    };

    getUserInfo();
  }, []);

  

  return (
    <View style={styles.accountContainer}>
      <TouchableOpacity onPress={() => {navigation.push("/(main)/parametre")}}>
        <Image 
          source={{ uri: userImage } as any} 
          style={styles.profilePicture} 
          testID="header-account-image"
        />
      </TouchableOpacity>
      <View>
        <Text style={[styles.welcomeText, TYPOGRAPHY.body.normal.base]}>
          {title}
        </Text>
        <Text style={[styles.userFullName, TYPOGRAPHY.heading.small.bold]}>
          {isLoading ? "Chargement..." : userFullName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  profilePicture: {
    width: SPACING["8xl"],
    height: SPACING["8xl"],
    borderRadius: 100,
    borderWidth: 4,
    borderColor: "rgba(0, 87, 172, .4)", // From University of Montreal
  },
  welcomeText: {},
  userFullName: {
    color: COLORS.black,
  },
});
