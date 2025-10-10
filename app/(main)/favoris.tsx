import { View, Text, FlatList, StatusBar, Image, Platform, TouchableOpacity } from 'react-native';
import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import ScrollableLayout from '@/components/layouts/ScrollableLayout';
import SPACING from '@/constants/Spacing';
import TYPOGRAPHY from "@/constants/Typography";
import HeaderLayout from '@/components/layouts/HeaderLayout';
import { clearTokens, getInfoFromToken, getToken, deleteAccount } from "@/utils/tokenStorage";
import CafeCard from "@/components/common/Cards/CafeCard";
import ArticleCard from "@/components/common/Cards/ArticleCard";
import COLORS from '@/constants/Colors';


export default function FavorisScreen() {
  const router = useRouter();
  
  const [cafeFavoris, setCafeFavoris] = React.useState<Array<any>>([]);
  const [cafesData, setCafesData] = React.useState<Array<any>>([]);
  const [ListeCafes, setListeCafes] = React.useState<{ items: Array<any> }>({ items: [] });
  const [isCafesLoading, setIsCafesLoading] = React.useState<boolean>(true);
  const [items, setItems] = React.useState<Array<any>>([]);
  const id = "68770cfda6b7c156881aa258"; 
  const [isArticlesLoading, setIsArticlesLoading] = React.useState<boolean>(true);
  
  const formatPrice = (price: string) => {
    if (price.charAt(price.length - 2) == ".") {
      return price + "0";
    }
    else{
      return price
    }
  }

  const getCafeById = async (id: string) => {
    try{
      
      const response = await fetch(`https://cafesansfil-api-r0kj.onrender.com/api/cafes/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const cafe = await response.json();
      return cafe;

    }
    catch (error) {
      console.error("Error in getCafeById: ", error);
      return null;
    }
  }


  useEffect(() => {
     const fetchWithTimeout = (url: string, timeout = 10000): Promise<Response> => {
      return Promise.race([
        fetch(url),
        new Promise<Response>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ]);
    };


    const fetchArticles = async () => {
      try {
        const response = await fetch(
          `https://cafesansfil-api-r0kj.onrender.com/api/cafes/${id}`
        );
        const data = await response.json();
        console.log("Cafe data fetched: ", data);
        
        // Extract all items from all categories and flatten them
        const allItems: any[] = [];
        if (data.menu && data.menu.categories) {
          data.menu.categories.forEach((category: any) => {
            if (category.items && Array.isArray(category.items)) {
              category.items.forEach((item: any) => {
                allItems.push({
                  ...item,
                  cafeId: id,
                  cafeSlug: data.slug
                });
              });
            }
          });
        }
        
        console.log("All items extracted: ", allItems.length);
        // Set only the first 3 items for testing
        setItems(allItems.slice(0, 3));
        // a desac pr le test
        setItems([])
        setIsArticlesLoading(false);
      } catch (error) {
        console.error('Error fetching articles:', error);
        setItems([]);
        setIsArticlesLoading(false);
      }
    };
    //fetchArticles();

      
  
    const fetchUserData = async () => {
      const token = await getToken();
      fetch('https://cafesansfil-api-r0kj.onrender.com/api/users/@me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
        .then(response => response.json())
        .then(data => {
          setCafeFavoris(data.cafe_favs);
        })
        .catch(error => console.error('Error fetching user data:', error));
    };

    fetchUserData();
  }, []);

  // Refetch favorites when screen comes into focus (only fetch cafe data if list changed)
  useFocusEffect(
    useCallback(() => {
      const refreshFavorites = async () => {
        try {
          console.log('Favoris screen focused - checking for updates');
          const token = await getToken();
          if (!token) {
            console.log('No token available, skipping favorites refresh');
            return;
          }

          const response = await fetch('https://cafesansfil-api-r0kj.onrender.com/api/users/@me', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            console.log(`Failed to fetch favorites: ${response.status}`);
            return;
          }

          const data = await response.json();
          const newFavorites = data.cafe_favs || [];
          
          // Compare the new favorites with current ones
          const currentSorted = [...cafeFavoris].sort().join(',');
          const newSorted = [...newFavorites].sort().join(',');
          
          if (currentSorted === newSorted) {
            console.log('✅ Favorites unchanged - skipping cafe data fetch');
            return;
          }

          console.log('🔄 Favorites changed - fetching cafe data');
          console.log('Old:', cafeFavoris);
          console.log('New:', newFavorites);
          
          setCafeFavoris(newFavorites);
          
          // Only fetch full cafe data if the list actually changed
          if (newFavorites.length > 0) {
            setIsCafesLoading(true);
            const cafesPromises = newFavorites.map((cafeId: string) => getCafeById(cafeId));
            const cafesResults = await Promise.all(cafesPromises);
            const validCafes = cafesResults.filter(cafe => cafe !== null);
            setCafesData(validCafes);
            setIsCafesLoading(false);
          } else {
            setCafesData([]);
            setIsCafesLoading(false);
          }
        } catch (error) {
          console.error('Error refreshing favorites:', error);
          setIsCafesLoading(false);
        }
      };

      refreshFavorites();
    }, [cafeFavoris])
  );


  return (
    <>
    <StatusBar />
    <HeaderLayout />
      <ScrollableLayout>
        <View>
          <Text  
            style={{
              marginVertical: SPACING["xl"], 
              marginHorizontal: SPACING["md"], 
              ...TYPOGRAPHY.heading.small.bold
            }}
            >Vos cafés favoris</Text>
        </View>


        

        {cafeFavoris.length === 0 ? (
          <View style={{ marginHorizontal: SPACING["md"], paddingVertical: SPACING["xl"] }}>
              <Text style={{ ...TYPOGRAPHY.body.normal.base, color: '#666', textAlign: 'center' }}>
                Aucun café favori pour le moment.
              </Text>
            </View>
        ) : !isCafesLoading && cafesData.length > 0 && (
           <FlatList
            data={cafesData}
            renderItem={({ item: cafe }) => (
              <CafeCard 
                name={cafe.name}
                image={cafe.banner_url}
                location={cafe.location.pavillon}
                priceRange="$$"
                rating={4.5}
                status={cafe.is_open}
                id={cafe.id} 
              />
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SPACING["md"],
              paddingBottom: SPACING["md"],
            }}
            ItemSeparatorComponent={() => <View style={{ width: SPACING["md"] }} />}
          />
        )}

         <View style={{ marginBottom: SPACING["xl"] }}>
          <Text 
            style={{
              marginVertical: SPACING["xl"], 
              marginHorizontal: SPACING["md"], 
              ...TYPOGRAPHY.heading.small.bold
            }}
          >Vos articles favoris</Text>
          
          {isArticlesLoading ? (
            <View style={{ marginHorizontal: SPACING["md"], paddingVertical: SPACING["xl"] }}>
              <Text style={{ ...TYPOGRAPHY.body.normal.base, color: '#999', textAlign: 'center' }}>
                Chargement des articles...
              </Text>
            </View>
          ) : items.length > 0 ? (
            <FlatList
              data={items}
              renderItem={({ item }) => {
                // Safely format price
                let priceDisplay = "N/A";
                if (item.price !== undefined && item.price !== null) {
                  const priceNum = typeof item.price === 'number' ? item.price : parseFloat(item.price);
                  if (!isNaN(priceNum)) {
                    priceDisplay = formatPrice(`$${priceNum.toFixed(2)}`);
                  }
                }

                return (
                  <TouchableOpacity 
                    onPress={() => {
                      // Navigate to article page
                      if (item.cafeSlug && (item.slug || item.id)) {
                        router.push(`/cafe/${item.cafeSlug}/${item.slug || item.id}`);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{
                      width: 280,
                      backgroundColor: '#fafafa',
                      borderRadius: 16,
                      overflow: 'hidden',
                      ...Platform.OS === 'android' ? {
                        elevation: 3,
                      } : {
                        shadowColor: COLORS.black,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                      }
                    }}>
                    {/* Article Image */}
                    {item.image_url ? (
                      <Image 
                        source={{ uri: item.image_url }}
                        style={{
                          width: '100%',
                          height: 160,
                          backgroundColor: '#F5F5F5'
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{
                        width: '100%',
                        height: 160,
                        backgroundColor: '#F5F5F5',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Text style={{ color: '#CCC', fontSize: 40 }}>☕</Text>
                      </View>
                    )}

                    {/* Article Info */}
                    <View style={{ padding: SPACING["md"] }}>
                      {/* Name and Price Row */}
                      <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: SPACING["xs"],
                      }}>
                        <Text 
                          style={{ 
                            ...TYPOGRAPHY.body.large.semiBold, 
                            flex: 1,
                            marginRight: SPACING["sm"]
                          }}
                          numberOfLines={2}
                        >
                          {item.name || 'Sans nom'}
                        </Text>
                        <View style={{
                          paddingHorizontal: SPACING["sm"],
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}>
                          <Text style={{ 
                            ...TYPOGRAPHY.body.normal.semiBold, 
                            color: COLORS.black,
                            fontSize: 14
                          }}>
                            {formatPrice(priceDisplay)}
                          </Text>
                        </View>
                      </View>

                      {/* Description */}
                      {item.description && (
                        <Text 
                          style={{ 
                            ...TYPOGRAPHY.body.small.base, 
                            color: '#666',
                            lineHeight: 18,
                            marginBottom: SPACING["sm"]
                          }}
                          numberOfLines={2}
                        >
                          {item.description}
                        </Text>
                      )}

                      {/* Stock Status */}
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center',
                        marginTop: SPACING["xs"]
                      }}>
                        <View style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: item.in_stock ? '#4CAF50' : '#FF5252',
                          marginRight: SPACING["xs"]
                        }} />
                        <Text style={{ 
                          ...TYPOGRAPHY.body.small.base, 
                          color: item.in_stock ? '#4CAF50' : '#FF5252',
                          fontWeight: '500'
                        }}>
                          {item.in_stock ? 'En Stock' : 'En Rupture'}
                        </Text>
                      </View>
                    </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item, index) => item.id || item.slug || index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: SPACING["md"],
                paddingBottom: SPACING["sm"]
              }}
              ItemSeparatorComponent={() => <View style={{ width: SPACING["md"] }} />}
            />
          ) : (
            <View style={{ marginHorizontal: SPACING["md"], paddingVertical: SPACING["xl"] }}>
              <Text style={{ ...TYPOGRAPHY.body.normal.base, color: '#666', textAlign: 'center' }}>
                Aucun article favori pour le moment.
              </Text>
            </View>
          )}
        </View>
      </ScrollableLayout>
    </>
  );
}