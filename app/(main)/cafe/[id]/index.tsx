import React, { useRef, useEffect, useState } from 'react';
import IconButton from "@/components/common/Buttons/IconButton";
import ArticleCard from "@/components/common/Cards/ArticleCard";
import CafeCard from "@/components/common/Cards/CafeCard";
import DayCard from "@/components/common/Cards/DayCard";
import CategoryCard from "@/components/common/Cards/CategoryCard";
import Tooltip from "@/components/common/Tooltip";
import COLORS from "@/constants/Colors";
import SPACING from "@/constants/Spacing";
import TYPOGRAPHY from "@/constants/Typography";
import { Link, router, useLocalSearchParams } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CakeSlice,
  Coffee,
  CupSoda,
  Heart,
  Locate,
  Sandwich,
  Search,
  Facebook,
  Instagram,
  Twitter,
  HelpCircle,
  DollarSign,
  CreditCard,
} from "lucide-react-native";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  FlatList,
  Linking,
  ActivityIndicator,
  Animated,
  TextInput,
  Dimensions
} from "react-native";
import { Cafe, Category, Item } from "@/constants/types/GET_cafe";
import { allCafe } from '@/constants/types/GET_list_cafe';
import ScrollableLayout from '@/components/layouts/ScrollableLayout';
const { Platform } = require('react-native');
const ActionSheetIOS = require('react-native').ActionSheetIOS;
const { Alert } = require('react-native');

export default function CafeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  // café id
  const { id } = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  // data for the café returned by the API
  // const [cafe, setCafe] = useState<Cafe | any>({ social_media:{} }); // set social media as empty array pour ne pas produire d'erreur dans l'utlisation de map après
  
  // list of items to display
  const [itemList, setItemList] = useState<Item[]>();

  const [cafe, setCafe] = useState<Cafe>(); // set social media as empty object
  const [data, setData] = useState<allCafe | any>([]);
  useEffect(() => {
      setIsLoading(true);
      fetch("https://cafesansfil-api-r0kj.onrender.com/api/cafes")
        .then((response) => response.json())
        .then((json) => {
          setData(json.items);
          // console.log(json)
        })
        .catch((error) => console.error(error))
        .finally(() => setIsLoading(false));;
    }, []);

  // Have an openable link
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
  };

  // function qui donne la plateform et le lien
  // const getSocialMediaLinks = (socialMediaObjet) => {
  //   if (!socialMediaObjet) return [];

  //   return Object.entries(socialMediaObjet).map(([plateform, link]) => ({
  //     name: plateform,
  //     link: link,
  //   }) );
  // };
  

  // Getting icons depending on platform names
  const getIcon = (platform : any) => {
    const icons = {
      x: Twitter,
      instagram: Instagram,
      facebook: Facebook,
    };
    return icons[platform] || HelpCircle;
  }; 

  // fetch cafe data
  useEffect(() => {
    // api data fetching
    setIsLoading(true);

    const fetchCafe = async () => {

      try {
        const response = await fetch(
          `https://cafesansfil-api-r0kj.onrender.com/api/cafes/${id}`
        );
        const json = await response.json();
        console.log("Social media: ", json.social_media);
        setCafe(json);

        // After setting the cafe data, filter the menu items
        // Directly use 'json' instead of 'cafe'
        const filteredItems = filterMenu("", json.menu.categories);
        setItemList(filteredItems);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCafe();
  }, [id]);
  
  const [activeFilter, setActiveFilter] = useState("Tous");
  const formatPrice = (price: string) => {
  if (price.charAt(price.length - 2) == ".") {
    return price + "0";
  }
  else{
    return price
  }
}

  // filter the menu based on argument filter
function filterMenu(filter?: string, menuData?: any): Item[] {
  let menu = menuData ? menuData : ((cafe && cafe.menu) ? cafe.menu.categories : []);
  let itemList: Item[] = [];

  // if no filter --> all items to be displayed
  if (filter) {
    setActiveFilter(filter)
    for (let i = 0; i < menu.length; i++) {
      // search for the filter
      if (menu[i].name == filter) {
        itemList = menu[i].items;
        break;
      }
    }
  } else {
    setActiveFilter("Tous");
    // loop through each individual category...
    for (let i = 0; i < menu.length; i++) {
      let itemsInCat: Item[] = menu[i].items;
      // loop through each item for that category...
      for (let j = 0; j < itemsInCat.length; j++) {
        // push the item to the list
        let item = itemsInCat[j];
        itemList.push(item);
      }
    }
  }
  return itemList;
}
  // Tableau des média sociaux des cafés : convertie le json {plateform: link} à un tableau [plateform, link]
  const socialMediaTab = cafe?.social_media ? Object.entries(cafe.social_media).map(([plateform, link]) =>
    ({plateform, link})) : [] ;

  // Méthode pour traduire en français
  const translationPaymentMethod = (method) => {
    const methodTranslated = {
      CREDIT : "Crédit",
      DEBIT : "Débit",
      CASH : "Cash",
    };
    return methodTranslated.method || method;
  };
  const openLocation = (location : any) => {
    console.log("Location: ", location);
    
    // Extract latitude and longitude from the location array
    const latitude = location[1];
    const longitude = location[0];

    // Define URLs for different map applications
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    const appleMapsUrl = `maps://app?daddr=${latitude},${longitude}`;
    const wazeUrl = `waze://?ll=${latitude},${longitude}&navigate=yes`;
    const genericMapsUrl = Platform.OS === 'android' ? `geo:${latitude},${longitude}` : appleMapsUrl;

    // Use Alert to present app choices to the user
    if (Platform.OS === 'ios') {
      // For iOS we can use ActionSheetIOS
      
      // First check which apps are installed before showing options
      Promise.all([
        Linking.canOpenURL(appleMapsUrl),
        Linking.canOpenURL("https://www.google.com/maps"),
        Linking.canOpenURL("waze://")
      ]).then(([appleSupported, googleSupported, wazeSupported]) => {
        // Build options array with only installed apps
        const options = ['Annuler'];
        const availableApps : any[] = [];
        
        if (appleSupported) {
          options.push('Apple Plans');
          availableApps.push('apple');
        }
        
        if (googleSupported) {
          options.push('Google Maps');
          availableApps.push('google');
        }
        
        if (wazeSupported) {
          options.push('Waze');
          availableApps.push('waze');
        }
        
        // Only show ActionSheet if there's at least one map app available
        if (availableApps.length > 0) {
          ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        (buttonIndex : number) => {
          if (buttonIndex === 0) return; // Cancel
          
          const selectedApp = availableApps[buttonIndex - 1];
          
          if (selectedApp === 'apple') {
            Linking.openURL(appleMapsUrl).catch(err => 
          console.error("Failed to open Apple Maps:", err));
          } else if (selectedApp === 'google') {
            Linking.openURL(googleMapsUrl).catch(err => 
          console.error("Failed to open Google Maps:", err));
          } else if (selectedApp === 'waze') {
            Linking.openURL(wazeUrl).catch(err => 
          console.error("Failed to open Waze:", err));
          }
        }
          );
        } else {
          // No map apps available, open with default URL scheme
          Linking.openURL(genericMapsUrl).catch(err => 
        console.error("Failed to open Maps:", err));
        }
      }).catch(err => {
        console.error("Error checking for installed map apps:", err);
        // Fallback to generic map URL
        Linking.openURL(genericMapsUrl).catch(err => 
          console.error("Failed to open Maps:", err));
      });
    } else {
      // For Android use Alert
      
      Alert.alert(
        'Choisir une application',
        'Quelle application souhaitez-vous utiliser pour afficher cet itinéraire?',
        [
          {
            text: 'Google Maps',
            onPress: () => Linking.openURL(googleMapsUrl)
              .catch(err => console.error("Failed to open Google Maps:", err))
          },
          {
            text: 'Waze',
            onPress: () => Linking.canOpenURL(wazeUrl)
              .then(supported => {
                if (supported) {
                  return Linking.openURL(wazeUrl);
                } else {
                  // Fallback to Google Maps
                  Alert.alert('Waze non installé', 'Voulez-vous ouvrir avec Google Maps?', [
                    { text: 'Non', style: 'cancel' },
                    { text: 'Oui', onPress: () => Linking.openURL(googleMapsUrl) }
                  ]);
                }
              })
              .catch(err => console.error("Failed to open Waze:", err))
          },
          { text: 'Annuler', style: 'cancel' },
        ]
      );
    }
  };

  // Tableau? des détails de payements
  const paymentDetails = cafe?.payment_details ? cafe.payment_details.map(({method, minimum}) => ({
    method : translationPaymentMethod(method), minimum })) : [];

console.log(paymentDetails);
    const [heart, toggleHeart] = useState(false);
    
    // Search bar animation states
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [searchText, setSearchText] = useState("");
    const searchWidth = useState(new Animated.Value(0))[0];
    const { width: screenWidth } = Dimensions.get('window');
    
    // Header background animation based on scroll
    const [isScrolledPastImage, setIsScrolledPastImage] = useState(false);
    const headerBackgroundOpacity = useState(new Animated.Value(0))[0];
    const IMAGE_HEIGHT = 350; // Should match cafeBackgroundImage height
    
    const toggleSearch = () => {
      const isExpanding = !isSearchExpanded;
      setIsSearchExpanded(isExpanding);
      
      // Calculate search width based on available space
      let targetWidth = 0;
      if (isExpanding) {
        targetWidth = screenWidth - 20;
      }
      
      Animated.timing(searchWidth, {
        toValue: targetWidth,
        duration: 300,
        useNativeDriver: false,
      }).start();
      
      if (!isExpanding) {
        setSearchText(""); // Clear search text when closing
      }
    };

    // Handle scroll to change header background
    const handleScroll = (event: any) => {
      const scrollY = event.nativeEvent.contentOffset.y;
      const shouldShowBackground = scrollY > IMAGE_HEIGHT - 100; // Start transition 100px before image ends
      
      if (shouldShowBackground !== isScrolledPastImage) {
        setIsScrolledPastImage(shouldShowBackground);
        
        Animated.timing(headerBackgroundOpacity, {
          toValue: shouldShowBackground ? 1 : 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    };
    

  if(isLoading){
    return(
      <ActivityIndicator size={'large'}
      style={{backgroundColor: COLORS.white,
              flex: 1,
              alignContent: 'center',
              justifyContent: 'center'
      }} />
    )
  }

  return (
    <SafeAreaView style={{ backgroundColor: '#000', flex: 1 }}>
      {/* Sticky Header */}
      <Animated.View style={[
        styles.stickyHeader,
        {
          backgroundColor: headerBackgroundOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', 'rgba(255, 255, 255, 0.95)'],
          }),
          borderBottomWidth: headerBackgroundOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
          borderBottomColor: 'rgba(0, 0, 0, 0.1)',
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: headerBackgroundOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.1],
          }),
          shadowRadius: 4,
          elevation: headerBackgroundOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 5],
          }),
        }
      ]}>
        <View style={styles.cafeHeaderButtons}>
          {/* Expanded Search Bar (spans full width when active) */}
          {isSearchExpanded && (
            <Animated.View style={[styles.searchContainer, { width: searchWidth }]}>
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher..."
                value={searchText}
                onChangeText={setSearchText}
                autoFocus={true}
                placeholderTextColor={COLORS.subtuleDark}
                onBlur={() => {
                  // Close search bar when focus is lost
                  toggleSearch();
                }}
              />
            </Animated.View>
          )}

          {/* Normal header layout when search is not expanded */}
          {!isSearchExpanded && (
            <>
              {/* Left side - Back button */}
              <View style={styles.cafeHeaderButtonsLeft}>
                <IconButton
                  Icon={ArrowLeft}
                  onPress={() => router.back()}
                  style={styles.cafeHeaderIconButtons}
                />
              </View>

              {/* Center - Cafe title (only when scrolled past image) */}
              <Animated.View style={[
                styles.cafeHeaderTitle,
                {
                  opacity: headerBackgroundOpacity,
                  transform: [{
                    translateY: headerBackgroundOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    })
                  }]
                }
              ]}>
                <Text style={styles.cafeHeaderTitleText} numberOfLines={1}>
                  {cafe?.name || ""}
                </Text>
              </Animated.View>

              {/* Right side - Search and Location buttons */}
              <View style={styles.cafeHeaderButtonsRight}>
                <IconButton 
                  Icon={Search} 
                  style={styles.cafeHeaderIconButtons} 
                  onPress={toggleSearch}
                />
                {!isScrolledPastImage && (
                  <IconButton 
                    Icon={Locate} 
                    style={styles.cafeHeaderIconButtons} 
                    onPress={() => cafe?.location && openLocation(cafe.location.geometry.coordinates)} 
                  />
                )}
              </View>
            </>
          )}
        </View>
      </Animated.View>
      
      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{backgroundColor: "#f4f4f4", flex: 1}} 
        contentContainerStyle={{ paddingTop: 0 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
      <View>
        <Image
          style={styles.cafeBackgroundImage}
          source={isLoading ? require("@/assets/images/placeholder/image2xl.png") : {uri: cafe?.banner_url}}
        />

        <View style={styles.cafeHeaderOpenStatus}>
          <Tooltip label={"Ouvert"} showChevron={false} status={cafe?.is_open ? "green" : "red"} />
        </View>
      </View>

      <View>
        <Text style={[TYPOGRAPHY.heading.medium.bold, styles.cafeName]}>
          {isLoading? "..." : cafe?.name}
        </Text>
        <Text style={[TYPOGRAPHY.body.large.base, styles.cafeDescription]}>
          {isLoading? "..." : cafe?.description}
        </Text>

        {/*Média sociaux*/}
          <View style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
            gap: 10,}}>

              {socialMediaTab.map(({plateform, link}) => ( link ? (

                <View key={plateform}>
                  <Tooltip
                  label={plateform.charAt(0).toUpperCase() + plateform.slice(1)}
                  onPress={() => openLink(link)}
                  Icon={getIcon(plateform)}
                  showChevron={false} color='white'/>
                </View>

              ) : null ))}
          </View>

        {/* Section paiement */}
          <Text
            style={[
              TYPOGRAPHY.body.large.semiBold,
              { color: COLORS.subtuleDark, textAlign: "center" },
              { marginTop: 20},
            ]}
          >
            Paiement
          </Text>
          <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 20,
            gap: 10,
          }}
        >
          {paymentDetails.map(({method, minimum}) => ( minimum ? (
            <View key={method}>
              <Tooltip
                key={`${method}-${minimum}`}
                label={`${method}`}
                showChevron={false }
                color="white"
                description={`Minimum: ${minimum}`}
                Icon={CreditCard}
                /> 
            </View>
                ) : 
                (
              <View key={method}>
                <Tooltip
                key={method} 
                  label={method}
                  showChevron={false}
                  color="white"
                  Icon={DollarSign}/>
              </View>    
              )
            //<Text>{method} MIN: {minimum}</Text> ) : <Text>{method}</Text> */ }
          ))}
        </View>

      </View>
      {/* Horaires du café */}
<View style={styles.hoursContainer}>
  <Text style={styles.hoursTitle}>Horaires</Text>
  <FlatList 
    data={cafe?.opening_hours} 
    horizontal
    showsHorizontalScrollIndicator={false}
    keyExtractor={item => item.day}
    contentContainerStyle={styles.hoursListContent}
    renderItem={({ item }) => (
      <View style={styles.dayCard}>
        <Text style={styles.dayName}>
          {item.day.slice(0, 3)}
        </Text>
        <View style={styles.timeBlocks}>
          {item.blocks.map((block, index) => (
            <View key={index} style={styles.timeBlock}>
              <Text style={styles.timeText}>{block.start} - {block.end}</Text>
            </View>
          ))}
          {item.blocks.length === 0 && (
            <Text style={styles.closedText}>Fermé</Text>
          )}
        </View>
      </View>
    )}
    ItemSeparatorComponent={() => <View style={styles.daySeparator} />}
  />
</View>

      {/* Menu */}
      <Text 
        style={{
          marginVertical: SPACING["md"], 
          marginHorizontal: SPACING["md"], 
          alignSelf: 'center',
          ...TYPOGRAPHY.heading.large.bold
        }}>Menu
        </Text>


      {/* Catégories */}
      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContainer}
          style={styles.filterScrollView}
        >
          {/* "Tous" filter */}
          <TouchableOpacity 
            style={[
              styles.filterChip,
              activeFilter === "Tous" ? styles.filterChipActive : styles.filterChipInactive
            ]}
            onPress={() => setItemList(filterMenu())}
          >
            <Text style={[
              styles.filterChipText,
              activeFilter === "Tous" ? styles.filterChipTextActive : styles.filterChipTextInactive
            ]}>
              Tous
            </Text>
          </TouchableOpacity>

          {/* Category filters */}
          {cafe?.menu.categories.map((item: Category) => (
            <TouchableOpacity 
              key={item.id}
              style={[
                styles.filterChip,
                activeFilter === item.name ? styles.filterChipActive : styles.filterChipInactive
              ]}
              onPress={() => setItemList(filterMenu(item.name))}
            >
              <Text style={[
                styles.filterChipText,
                activeFilter === item.name ? styles.filterChipTextActive : styles.filterChipTextInactive
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Menu */}
      <FlatList 
        data={itemList? itemList : []}  
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <ArticleCard
            cafeSlug={cafe?.slug}
            slug={item.id}
            name={item.name} 
            price={"$" + item.price} 
            status={item.in_stock? "In Stock" : "Out of Stock"}
            image={item.image_url}
            calories={item.description}
            style={styles.articleCardWrapper}
          />
        )}
        scrollEnabled={false}
        style={styles.menuContainer}
        ItemSeparatorComponent={() => <View style={{ height: SPACING["md"] }} />}
      />      

      {/* Cafés similaires */}
      <Text 
        style={{
          marginVertical: SPACING["xl"], 
          marginHorizontal: SPACING["md"], 
          ...TYPOGRAPHY.heading.small.bold
        }}>
          Autres cafés similaires
        </Text>
        <FlatList
          data={data}
          renderItem={({ item }) => (
            <CafeCard
              name={item.name}
              image={item.banner_url}
              location={item.location.pavillon}
              priceRange="$$"
              //rating={4.8}
              status={item.is_open}
              id={item.id}
            />
          )}
          keyExtractor={(item) => item.id}
          horizontal
          ItemSeparatorComponent={() => <View style={{ width: SPACING["sm"] }} />}
          style={{
            paddingHorizontal: SPACING["sm"],
            paddingBottom: SPACING["md"],
          }}
        />


        {/* TODO: IMPLÉMENTER LA FLATLIST */}

    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stickyHeader: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 37 : 0, // Position under status bar/notch
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 12 : 30,
    paddingBottom: 12,
    marginTop: Platform.OS === 'ios' ? 8 : 0, // Extra spacing for iOS notch area
  },
  cafeBackgroundImage: {
    width: "100%",  // Fill width
    height: 250,    // Fixed height, adjust as needed
  },
  cafeHeaderButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
  },
  cafeHeaderButtonsLeft: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 40, // Ensure consistent left space
  },
  cafeHeaderTitle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  cafeHeaderTitleText: {
    ...TYPOGRAPHY.heading.small.bold,
    color: COLORS.black,
    textAlign: "center",
  },
  stickyHeaderSpacer: {
    height: 50, // Height to push content below the sticky header
    backgroundColor: "transparent",
  },
  cafeHeaderButtonsRight: {
    
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  cafeHeaderIconButtons: {
    backgroundColor: "white",
  },
  searchContainer: {
    backgroundColor: "white",
    borderRadius: 25,
    height: 40,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: COLORS.black,
    backgroundColor: "transparent",
  },
  cafeHeaderOpenStatus: {
    position: "absolute",
    paddingHorizontal: 16,
    bottom: 0,
    marginBottom: 26,
    alignSelf: "center",
  },
  cafeName: {
    marginHorizontal: SPACING["md"],
    marginTop: SPACING["2xl"],
    textAlign: "center",
  },
  cafeDescription: {
    marginHorizontal: SPACING["md"],
    lineHeight: 21,
    marginTop: SPACING["xs"],
    textAlign: "center",
  },
  hoursContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  hoursTitle: {
    ...TYPOGRAPHY.heading.medium.bold,
    color: COLORS.black,
    marginBottom: 15,
    textAlign: "center",
  },
  hoursListContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dayCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    minWidth: 90,
    alignItems: 'center',
  },
  dayName: {
    ...TYPOGRAPHY.body.normal.semiBold,
    color: COLORS.black,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  timeBlocks: {
    width: '100%',
  },
  timeBlock: {
    marginVertical: 3,
  },
  timeText: {
    ...TYPOGRAPHY.body.small.base,
    color: COLORS.subtuleDark,
    textAlign: 'center',
  },
  closedText: {
    ...TYPOGRAPHY.body.small.bold,
    color: COLORS.status.red,
    textAlign: 'center',
    marginTop: 4,
  },
  daySeparator: {
    width: 10,
  },
  filterSection: {
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterScrollContainer: {
    paddingHorizontal: SPACING["md"],
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 12,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 4,
  },
  filterChipActive: {
    backgroundColor: COLORS.black,
    borderWidth: 0,
  },
  filterChipInactive: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  filterChipTextInactive: {
    color: COLORS.black,
  },
  // Custom Menu Item Styles
  menuContainer: {
    paddingHorizontal: SPACING["md"],
    marginTop: SPACING["md"],
  },
  articleCardWrapper: {
    marginHorizontal: 0,
  },
});
