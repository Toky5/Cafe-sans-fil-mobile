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
  const [filteredItemList, setFilteredItemList] = useState<Item[]>();
  const [isSearchActive, setIsSearchActive] = useState(false);

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

  // Clear search when using category filters
  setIsSearchActive(false);
  setFilteredItemList(undefined);
  setSearchText("");

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
        setFilteredItemList(undefined); // Clear filtered results
        setIsSearchActive(false); // Deactivate search
        setActiveFilter("Tous"); // Reset filter to "Tous"
      }
    };

    // Handle search text changes
    const handleSearchChange = (text: string) => {
      setSearchText(text);
      
      if (!text.trim()) {
        // If search is empty, clear filtered results
        setFilteredItemList(undefined);
        setIsSearchActive(false);
        return;
      }

      // Scroll to menu section when user starts typing
      if (!isSearchActive && scrollViewRef.current) {
        setIsSearchActive(true);
        // Scroll to menu section (adjust offset as needed based on your layout)
        scrollViewRef.current.scrollTo({ y: 600, animated: true });
      }

      // Get all menu items from all categories
      const allItems: Item[] = [];
      cafe?.menu.categories.forEach(category => {
        allItems.push(...category.items);
      });

      // Filter items based on search text
      const filtered = allItems.filter(item => 
        item.name.toLowerCase().includes(text.toLowerCase()) ||
        item.description?.toLowerCase().includes(text.toLowerCase())
      );

      setFilteredItemList(filtered);
      setActiveFilter(""); // Clear active filter when searching
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
    <SafeAreaView style={{ flex: 1 }}>
      {/* Sticky Header */}
      <Animated.View style={[
        styles.stickyHeader,
        {
          backgroundColor: headerBackgroundOpacity.interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', 'rgba(255, 255, 255, 1)'],
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
                placeholder="Rechercher dans le menu..."
                value={searchText}
                onChangeText={handleSearchChange}
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
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <IconButton 
                      Icon={Locate} 
                      style={styles.cafeHeaderIconButtons} 
                      onPress={() => cafe?.location && openLocation(cafe.location.geometry.coordinates)} 
                    />
                    <IconButton
                      Icon={Heart}
                      onPress={() => toggleHeart(!heart)}
                      iconColor={heart ? COLORS.status.red : COLORS.black}
                      fill={heart ? "red" : "none"}
                      style={styles.cafeHeaderIconButtons}
                    />
                  </View>
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
<View style={styles.hoursSection}>
  <Text style={styles.sectionTitle}>Horaires d'ouverture</Text>
  <ScrollView 
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.hoursScrollContent}
  >
    {(() => {
      // Map English days to French
      const dayMapping: { [key: string]: string } = {
        'monday': 'lundi',
        'tuesday': 'mardi',
        'wednesday': 'mercredi',
        'thursday': 'jeudi',
        'friday': 'vendredi',
        'saturday': 'samedi',
        'sunday': 'dimanche'
      };

      // Get today's day in French
      const todayFrench = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
      
      // Find today's index in the opening_hours array
      const hours = cafe?.opening_hours || [];
      const todayIndex = hours.findIndex(item => {
        const itemDayFrench = dayMapping[item.day.toLowerCase()] || item.day.toLowerCase();
        return itemDayFrench === todayFrench;
      });

      // Reorder array to start from today
      const reorderedHours = todayIndex >= 0 
        ? [...hours.slice(todayIndex), ...hours.slice(0, todayIndex)]
        : hours;

      return reorderedHours.map((item, index) => {
        const isToday = index === 0 && todayIndex >= 0;
        const itemDayFrench = dayMapping[item.day.toLowerCase()] || item.day.toLowerCase();
        
        return (
          <View 
            key={item.day} 
            style={[
              styles.modernDayCard,
              isToday && styles.modernDayCardToday
            ]}
          >
            <View style={styles.dayHeader}>
              <Text style={[
                styles.modernDayName,
                isToday && styles.modernDayNameToday
              ]}>
                {isToday ? "Aujourd'hui" : itemDayFrench.charAt(0).toUpperCase() + itemDayFrench.slice(1)}
              </Text>
            </View>
            <View style={styles.modernTimeBlocks}>
              {item.blocks.length > 0 ? (
                item.blocks.map((block, blockIndex) => (
                  <View key={blockIndex} style={styles.modernTimeBlock}>
                    <Text style={[
                      styles.modernTimeText,
                      isToday && styles.modernTimeTextToday
                    ]}>
                      {block.start}
                    </Text>
                    <Text style={[styles.timeSeparator, isToday && styles.timeSeparatorToday]}>-</Text>
                    <Text style={[
                      styles.modernTimeText,
                      isToday && styles.modernTimeTextToday
                    ]}>
                      {block.end}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.closedContainer}>
                  <Text style={[styles.modernClosedText, isToday && styles.modernClosedTextToday]}>Fermé</Text>
                </View>
              )}
            </View>
          </View>
        );
      });
    })()}
  </ScrollView>
</View>

      {/* Menu Section */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Notre Menu</Text>
        
        {/* Catégories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modernFilterScrollContainer}
          style={styles.modernFilterScrollView}
        >
          {/* "Tous" filter */}
          <TouchableOpacity 
            style={[
              styles.modernFilterChip,
              activeFilter === "Tous" && styles.modernFilterChipActive
            ]}
            onPress={() => setItemList(filterMenu())}
          >
            <Text style={[
              styles.modernFilterChipText,
              activeFilter === "Tous" && styles.modernFilterChipTextActive
            ]}>
              Tous
            </Text>
          </TouchableOpacity>

          {/* Category filters */}
          {cafe?.menu.categories.map((item: Category) => (
            <TouchableOpacity 
              key={item.id}
              style={[
                styles.modernFilterChip,
                activeFilter === item.name && styles.modernFilterChipActive
              ]}
              onPress={() => setItemList(filterMenu(item.name))}
            >
              <Text style={[
                styles.modernFilterChipText,
                activeFilter === item.name && styles.modernFilterChipTextActive
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Menu Items Grid */}
        <View style={styles.menuGrid}>
          {(() => {
            // Use filtered list if search is active, otherwise use regular itemList
            const displayItems = isSearchActive ? filteredItemList : itemList;
            
            return displayItems && displayItems.length > 0 ? (
              displayItems.map((item) => (
                <ArticleCard
                  key={item.id}
                  cafeSlug={cafe?.slug}
                  slug={item.id}
                  name={item.name} 
                  price={"$" + item.price} 
                  status={item.in_stock ? "En Stock" : "En Rupture"}
                  image={item.image_url}
                  calories={item.description}
                  size="large"
                />
              ))
            ) : (
              <View style={styles.emptyMenuContainer}>
                <Text style={styles.emptyMenuText}>
                  {isSearchActive ? `Aucun résultat pour "${searchText}"` : "Aucun article disponible"}
                </Text>
              </View>
            );
          })()}
        </View>
      </View>      

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
              rating={4.5}
              status={item.is_open}
              id={item.id}
            />
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
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
    top: Platform.OS === 'ios' ? 0 : 0, // Position under status bar/notch
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? "16%" : 30,
    paddingBottom: 12,
    
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
    backgroundColor: COLORS.lightGray,
    borderRadius: 25,
    height: 40,
    overflow: "hidden",
    marginLeft: -6,

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
  // Section Titles
  sectionTitle: {
    ...TYPOGRAPHY.body.large.semiBold,
    color: COLORS.black,
    marginBottom: 12,
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Modern Hours Styles
  hoursSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  hoursScrollContent: {
    paddingRight: 16,
  },
  modernDayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginRight: 10,
  },
  modernDayCardToday: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  dayHeader: {
    marginBottom: 8,
  },
  modernDayName: {
    ...TYPOGRAPHY.body.normal.semiBold,
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '600',
  },
  modernDayNameToday: {
    color: '#fff',
  },
  modernTimeBlocks: {
    gap: 4,
  },
  modernTimeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modernTimeText: {
    ...TYPOGRAPHY.body.small.base,
    color: '#666',
    fontSize: 12,
  },
  modernTimeTextToday: {
    color: '#fff',
  },
  timeSeparator: {
    color: '#999',
    fontSize: 12,
  },
  timeSeparatorToday: {
    color: '#fff',
  },
  closedContainer: {
    paddingVertical: 4,
  },
  modernClosedText: {
    ...TYPOGRAPHY.body.small.base,
    color: '#999',
    fontSize: 12,
  },
  modernClosedTextToday: {
    color: '#fff',
  },
  // Modern Menu Styles
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  modernFilterScrollView: {
    flexGrow: 0,
    marginBottom: 16,
  },
  modernFilterScrollContainer: {
    gap: 8,
    paddingRight: 16,
  },
  modernFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffffff',
  },
  modernFilterChipActive: {
    backgroundColor: '#000',
  },
  modernFilterChipText: {
    ...TYPOGRAPHY.body.normal.semiBold,
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  modernFilterChipTextActive: {
    color: '#fff',
  },
  menuGrid: {
    gap: 12,
  },
  emptyMenuContainer: {
    width: '100%',
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyMenuText: {
    ...TYPOGRAPHY.body.normal.base,
    color: COLORS.subtuleDark,
  },
});
