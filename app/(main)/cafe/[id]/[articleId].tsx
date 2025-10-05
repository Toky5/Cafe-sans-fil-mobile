import Button from "@/components/common/Buttons/Button";
import IconButton from "@/components/common/Buttons/IconButton";
import ArticleCard from "@/components/common/Cards/ArticleCard";
import Counter from "@/components/common/Inputs/Counter";
import Tooltip from "@/components/common/Tooltip";
import COLORS from "@/constants/Colors";
import SPACING from "@/constants/Spacing";
import TYPOGRAPHY from "@/constants/Typography";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Search,
  Locate,
  Heart,
  Star,
  Vegan,
  ThumbsUp,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Image, TextInput, KeyboardAvoidingView,
  Platform,
  ScrollView, FlatList } from "react-native";

import { Item } from "@/constants/types/GET_item";
import { fetchSync, saveSecurely, saveSync } from "@/scripts/storage";
import * as hash from "object-hash";

import { fetchPannier } from "@/scripts/pannier";

export default function ArticleScreen() {


const [error, setError] = useState<string | null>(null);

  const { id, articleId } = useLocalSearchParams();
  console.log("Café Id", id);
  const [reload, setReload] = useState(false);
  console.log("Article Id", articleId) ;
  const formatPrice = (price: string) => {
    if (price.charAt(price.length - 2) == ".") {
      return price + "0";
    }
    else{
      return price
    }
  }

  const scrollViewRef = useRef<ScrollView>(null);

  const [menuItem, setMenuItem] = useState<Item | any>({});
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1); // nombre d'article à mettre dans le panier
  const [selectedIndex, setSelectedIndex] = useState<Number |null>(null); // option button
  const [heart, toggleHeart] = useState(false); // heart toggle state

  // reset les options à non sélectionnée
  useFocusEffect(
    useCallback(() => {
      setSelectedIndex(null);
      setQuantity(1);
    },[])
  )

  useEffect(() => {
    // Reset states when articleId changes
    setLoading(true);
    setError(null);
    setMenuItem({});
    
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    
    const fetchMenuItem = async () =>{
      try {
        console.log(`test cafe slug ${id}`);
        console.log(`article slug ${articleId}`);
        
        if (!id || !articleId) {
          throw new Error('Missing cafe ID or article ID');
        }
        
        const response = await fetch(`https://cafesansfil-api-r0kj.onrender.com/api/cafes/${id}/menu/items/${articleId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const json = await response.json();
        //console.log(json.image_url);
        //console.log(typeof(id));
        setMenuItem(json);
      } catch (error) {
          console.error('Fetch error:', error);
          setError(error instanceof Error ? error.message : 'Failed to fetch menu item');
      } finally{
        setLoading(false);
      }
    }
    
    // Add a small delay to prevent rapid API calls
    const timeoutId = setTimeout(fetchMenuItem, 100);
    
    return () => clearTimeout(timeoutId);
  }, [articleId, id]);
  
  
  // tableau des options fetch du api
  const options = menuItem.options ? menuItem.options.map(({type, value, fee}) => 
    ({type, value, fee})) : []; 

  // Prix total 
  const selectedFee = (selectedIndex !== null && selectedIndex >= 0 && selectedIndex < options.length) 
  ? Number(options[selectedIndex].fee) : 0;
  const total = ((Number(menuItem.price) + Number(selectedFee)) * quantity).toFixed(2);



  const panierID = "12345";
  function addToCart(){
    
    //get current list of items from cart
    let currCart = new Array();
    try{
      currCart = fetchSync(panierID);
      //console.log("here");
      //console.log(currCart);
      if (!currCart){
        currCart = new Array();
        saveSync(panierID,currCart);
      }
      console.log("here");
      console.log(fetchSync(panierID));
    }catch(error){
      currCart = new Array();
    }

    type panierItem = {
      id : string;
      quantity:number;
    };
    //check for same item
    let currQuantity = 1;
    let itemHash = hash.MD5(menuItem);

    for(const item of currCart){
      if(item.id == itemHash){
        currQuantity = currQuantity + item.quantity;
        item.quantity = currQuantity;
        break;
      }
    };

    //add new item
    if(currQuantity == 1){
      saveSync(itemHash, menuItem);
      let newItem : panierItem = {
        id:itemHash,
        quantity:1
      };
      currCart.push(newItem);
      //console.log("here");
      //console.log(fetchSync(panierID));
    }
    saveSync(panierID,currCart);
    
    //push to panier (might remove)
    router.push('/pannier');
    
  }

  // fonction show option view 
  function showOptions(){
    return (
      <View style={{ borderBottomWidth: 3, borderColor: COLORS.lightGray, paddingHorizontal: 16 }}>
      <View style={{ marginBlock: 20, gap: 8 }}>
        <Text style={[TYPOGRAPHY.heading.small.bold]}>Options {options[0].type}</Text>
        <Text
        style={[
          TYPOGRAPHY.body.large.base,
          { color: COLORS.subtuleDark, lineHeight: 21 },
        ]}
      > 
        Sélectionnez les options qui vous intéressent.
      </Text>
      </View >
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
        <FlatList data={options} renderItem={({item, index}) => (
          
          <Button onPress={()=> setSelectedIndex(prev => (prev === index ? null : index))} 
          style={{ backgroundColor : selectedIndex === index ? COLORS.black : COLORS.lightGray, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, flex: 1,}}>
            <Text style={[TYPOGRAPHY.body.normal.semiBold, { textAlign: "center", color: selectedIndex === index ? COLORS.white : COLORS.subtuleDark, }]}>
              {item.value}{item.fee != 0 && ` (+$${formatPrice(item.fee)})`}
            </Text>
          </Button> )}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          ItemSeparatorComponent={() => <View style={{ width: SPACING["md"] }} />} 
          // padding
          // style={{paddingHorizontal: SPACING["sm"], paddingBottom: SPACING["md"]}}
        />
      </View> 
      </View>
        ) 
      }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      style={[{ backgroundColor: COLORS.white }]}>
      <View>
        <Image
          style={styles.cafeBackgroundImage}
          source={loading ? require("@/assets/images/placeholder/image2xl.png") : {uri: menuItem.image_url}}
        />

        <View style={styles.cafeHeaderButtons}>
          <IconButton
            Icon={ArrowLeft}
            onPress={() => {toggleHeart(false); router.replace(`/cafe/${id}`)}}
            style={styles.cafeHeaderIconButtons}
          />
          <View style={styles.cafeHeaderButtonsRight}>
            <IconButton 
              Icon={Heart} 
              style={styles.cafeHeaderIconButtons}
              iconColor={heart ? COLORS.status.red : COLORS.black}
              fill={heart ? COLORS.status.red : "none"}
              onPress={() => toggleHeart(!heart)}
            />
          </View>
        </View>

        <View style={styles.cafeHeaderOpenStatus}>
          <Tooltip label={menuItem.in_stock ? "En Stock" : "En Rupture"} showChevron={false} status={menuItem.in_stock ?  "green" : "red"} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        {error ? (
          <View style={{ marginTop: 28, padding: 16, backgroundColor: '#FFE6E6', borderRadius: 8, marginBottom: 20 }}>
            <Text style={[TYPOGRAPHY.body.normal.semiBold, { color: '#D32F2F', marginBottom: 8 }]}>
              Erreur de chargement
            </Text>
            <Text style={[TYPOGRAPHY.body.small.base, { color: '#D32F2F' }]}>
              {error}
            </Text>
          </View>
        ) : (
          <>
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginTop: 28,
                marginBottom: 10,
              }}
            >
              <Text style={TYPOGRAPHY.heading.medium.bold}>{loading? "Chargement...": menuItem.name}</Text>
              
            </View>
            <Text
              style={[
                TYPOGRAPHY.body.large.base,
                { color: COLORS.subtuleDark, lineHeight: 21 },
              ]}
            >
              {loading ? "": menuItem.description}
            </Text>
          </>
        )}
      </View>
      
{/*
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          paddingHorizontal: 16,
          marginTop: 20,
          marginBottom: 28,
        }}
      >
        
        <Tooltip label="95%" Icon={ThumbsUp} showChevron={false}></Tooltip>
        <Tooltip label="Populaire" showChevron={false} /> 
      </View> */}
      
{/*
      <View style={{ borderTopWidth: 3, borderBottomWidth: 3, borderColor: COLORS.lightGray, paddingHorizontal: 16 }}>
        <View style={{ marginBlock: 20 }}>
          <Text style={[TYPOGRAPHY.heading.small.bold]}>Taille de la boisson</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          <View style={{ backgroundColor: COLORS.lightGray, paddingVertical: 12, borderRadius: 10, flex: 1,  }}>
            <Text style={[TYPOGRAPHY.body.normal.semiBold, { textAlign: "center" }]}>Petite</Text>
          </View>
          <View style={{ backgroundColor: COLORS.lightGray, paddingVertical: 12, borderRadius: 10, flex: 1,  }}>
            <Text style={[TYPOGRAPHY.body.normal.semiBold, { textAlign: "center" }]}>Moyenne</Text>
          </View>
          <View style={{ backgroundColor: COLORS.lightGray, paddingVertical: 12, borderRadius: 10, flex: 1,  }}>
            <Text style={[TYPOGRAPHY.body.normal.semiBold, { textAlign: "center" }]}>Grande</Text>
          </View>
        </View>
      </View> */}
      {/* if options est vide don't show section */}
      {options.length > 0 && (showOptions())}

     
      <View style={{ borderBottomWidth: 3, borderColor: COLORS.lightGray, paddingHorizontal: 16 }}>
         {/* a remove pour la 1.0
        <View style={{ marginBlock: 20, gap: 8 }}>
          <Text style={[TYPOGRAPHY.heading.small.bold]}>Instructions</Text>
          <Text
          style={[
            TYPOGRAPHY.body.large.base,
            { color: COLORS.subtuleDark, lineHeight: 21 },
          ]}
        >
          Un mot à ajouter sur votre commande ?
        </Text>
        </View>
        <TextInput
          style={styles.textInput}
          placeholder={"Ajouter des instructions"}
          placeholderTextColor={COLORS.subtuleDark}
          returnKeyLabel="done"
          returnKeyType="done"
          multiline
          numberOfLines={20}
          onChangeText={() => {}}
        ></TextInput>
        */}
        {/*
        <View style={{ marginBottom: 44, marginTop: 32, flexDirection: "row", alignItems: "center", gap: 32}}>
          <Counter
          count={quantity}
          setCount={setQuantity}></Counter>
          <Button onPress={() => addToCart()} style={{ flex: 1, width: "auto" }}>
            Ajouter au panier ・ ${total /* menuItem.price * quantity /* + fees *
          </Button>
        </View>
      */}
      </View>
      

      

    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EDF1F3",
    paddingHorizontal: 16,
    paddingVertical: 12,
    boxShadow: "0px 1px 2px 0px rgba(228, 229, 231, 0.24)",
    color: "#000000",
    height: 160,
  },
  cafeBackgroundImage: {
    width: "100%",  // Fill width
    height: 250,    
  },
  cafeHeaderButtons: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
    marginTop: SPACING["9xl"],
  },
  cafeHeaderButtonsRight: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  cafeHeaderIconButtons: {
    backgroundColor: "white",
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
});
