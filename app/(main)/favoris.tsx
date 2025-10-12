import { View, Text, FlatList, StatusBar, Image, Platform, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
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
import ArticleModalContent from "@/components/common/ArticleModalContent";
import IconButton from "@/components/common/Buttons/IconButton";
import { X } from "lucide-react-native";
import COLORS from '@/constants/Colors';


export default function FavorisScreen() {
  const router = useRouter();
  
  // Cafe favorites: array of cafe IDs (strings)
  // Example: ["cafe1", "cafe2", "cafe3"]
  const [cafeFavoris, setCafeFavoris] = React.useState<Array<any>>([]);
  const [cafesData, setCafesData] = React.useState<Array<any>>([]);
  const [ListeCafes, setListeCafes] = React.useState<{ items: Array<any> }>({ items: [] });
  const [isCafesLoading, setIsCafesLoading] = React.useState<boolean>(true);
  
  // Article favorites: array of [article_id, cafe_id] pairs
  // Example: [["article1", "cafe1"], ["article2", "cafe2"]]
  const [articlesFavoris, setArticlesFavoris] = React.useState<Array<any>>([]);
  const [articlesData, setArticlesData] = React.useState<Array<any>>([]);
  const [isArticlesLoading, setIsArticlesLoading] = React.useState<boolean>(false);
  
  // Modal state for article details
  const [isArticleModalVisible, setIsArticleModalVisible] = React.useState(false);
  const [selectedArticleId, setSelectedArticleId] = React.useState<string | null>(null);
  const [selectedCafeId, setSelectedCafeId] = React.useState<string | null>(null);
  
  const formatPrice = (price: string) => {
    if (price.charAt(price.length - 2) == ".") {
      return price + "0";
    }
    else{
      return price
    }
  }

  const getCafeById = async (id: string) => {
    try {
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
    } catch (error) {
      console.error("Error in getCafeById: ", error);
      return null;
    }
  }

  const getArticleById = async (articleId: string, cafeid: string) => {
    try {
      const response = await fetch(`https://cafesansfil-api-r0kj.onrender.com/api/cafes/${cafeid}/menu/items/${articleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const article = await response.json();
      return article;
    } catch (error) {
      console.error("Error in getArticleById: ", error);
      return null;
    }
  }


  useEffect(() => {
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
          setCafeFavoris(data.cafe_favs || []);
          setArticlesFavoris(data.articles_favs || []);
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
          const newArticlesFavorites = data.articles_favs || [];
          
          // Compare the new favorites with current ones
          const currentCafesSorted = [...cafeFavoris].sort().join(',');
          const newCafesSorted = [...newFavorites].sort().join(',');
          
          // For articles_favs, convert nested arrays to strings for comparison
          // articles_favs is [[article_id, cafe_id], [article_id, cafe_id], ...]
          const currentArticlesSorted = [...articlesFavoris]
            .map(pair => Array.isArray(pair) ? pair.join(':') : pair)
            .sort()
            .join(',');
          const newArticlesSorted = [...newArticlesFavorites]
            .map(pair => Array.isArray(pair) ? pair.join(':') : pair)
            .sort()
            .join(',');
          
          const cafesChanged = currentCafesSorted !== newCafesSorted;
          const articlesChanged = currentArticlesSorted !== newArticlesSorted;
          
          // If nothing changed, skip everything
          if (!cafesChanged && !articlesChanged) {
            console.log('✅ No changes - skipping all data fetches');
            return;
          }

          // Log what changed
          if (cafesChanged) {
            console.log('🔄 Cafe favorites changed');
            console.log('Old cafes:', cafeFavoris);
            console.log('New cafes:', newFavorites);
          }
          if (articlesChanged) {
            console.log('🔄 Article favorites changed');
            console.log('Old articles:', articlesFavoris);
            console.log('New articles:', newArticlesFavorites);
          }

          // Update state
          setCafeFavoris(newFavorites);
          setArticlesFavoris(newArticlesFavorites);
          
          // Fetch cafe data if cafe favorites changed
          if (cafesChanged) {
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
          }
          
          // Fetch article data if article favorites changed
          if (articlesChanged) {
            if (newArticlesFavorites.length > 0) {
              setIsArticlesLoading(true);
              // newArticlesFavorites is [[article_id, cafe_id], ...]
              const articlesPromises = newArticlesFavorites.map((pair: any) => {
                const [articleId, cafeId] = pair;
                return getArticleById(articleId, cafeId);
              });
              const articlesResults = await Promise.all(articlesPromises);
              const validArticles = articlesResults.filter(article => article !== null);
              setArticlesData(validArticles);
              setIsArticlesLoading(false);
            } else {
              setArticlesData([]);
              setIsArticlesLoading(false);
            }
          }
        } catch (error) {
          console.error('Error refreshing favorites:', error);
          setIsCafesLoading(false);
        }
      };

      refreshFavorites();
    }, [cafeFavoris, articlesFavoris])
  );

  // Article modal handlers
  const openArticleModal = (articleId: string, cafeId: string) => {
    setSelectedArticleId(articleId);
    setSelectedCafeId(cafeId);
    setIsArticleModalVisible(true);
  };
  
  const closeArticleModal = () => {
    setIsArticleModalVisible(false);
    setSelectedArticleId(null);
    setSelectedCafeId(null);
  };

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
          
          {articlesFavoris.length === 0 ? (
            <View style={{ marginHorizontal: SPACING["md"], paddingVertical: SPACING["xl"] }}>
              <Text style={{ ...TYPOGRAPHY.body.normal.base, color: '#666', textAlign: 'center' }}>
                Aucun article favori pour le moment.
              </Text>
            </View>
          ) : isArticlesLoading ? (
            <View style={{ marginHorizontal: SPACING["md"], paddingVertical: SPACING["xl"] }}>
              <Text style={{ ...TYPOGRAPHY.body.normal.base, color: '#999', textAlign: 'center' }}>
                Chargement des articles...
              </Text>
            </View>
          ) : articlesData.length > 0 ? (
            <FlatList
              data={articlesData}
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
                      // Navigate to article page or open modal based on platform
                      console.log('📱 article pressed', item);
                      console.log('📱 Article ID:', item.id, 'Type:', typeof item.id);
                      console.log('📱 Cafe ID:', item.cafe_id, 'Type:', typeof item.cafe_id);
                      if (item.cafe_id && item.id) {
                        if (Platform.OS === 'ios') {
                          // iOS: Open modal
                          console.log('📱 Opening modal for article:', item.id);
                          openArticleModal(item.id, item.cafe_id);
                        } else {
                          // Android: Navigate to page
                          console.log('📱 Navigating to article:', `/cafe/${item.cafe_id}/${item.id}`);
                          router.push(`/cafe/${item.cafe_id}/${item.id}`);
                        }
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
          ) : null}
        </View>
      </ScrollableLayout>
      
      {/* Article Detail Modal */}
      {isArticleModalVisible && (
        <Modal
          visible={isArticleModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeArticleModal}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
            <View style={{ flex: 1 }}>
              {/* Modal Header */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'flex-start',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#E8E8E8',
                backgroundColor: COLORS.white
              }}>
                <IconButton
                  Icon={X}
                  onPress={closeArticleModal}
                  style={{ backgroundColor: COLORS.lightGray }}
                />
              </View>
              
              {/* Article Content */}
              {selectedArticleId && selectedCafeId && (
                <ArticleModalContent 
                  articleId={selectedArticleId} 
                  cafeId={selectedCafeId}
                  onClose={closeArticleModal}
                />
              )}
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
}