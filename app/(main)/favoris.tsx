import { View,  Text , FlatList, StatusBar} from 'react-native';
import React, { useEffect ,} from 'react';
import ScrollableLayout from '@/components/layouts/ScrollableLayout';
import SPACING from '@/constants/Spacing';
import TYPOGRAPHY from "@/constants/Typography";
import HeaderLayout from '@/components/layouts/HeaderLayout';
import { clearTokens, getInfoFromToken, getToken, deleteAccount} from "@/utils/tokenStorage";
import CafeCard from "@/components/common/Cards/CafeCard";

export default function FavorisScreen() {

  const [cafeFavoris, setCafeFavoris] = React.useState<Array<any>>([]);
  const [ListeCafes, setListeCafes] = React.useState<{ items: Array<any> }>({ items: [] });
  const [isCafesLoading, setIsCafesLoading] = React.useState<boolean>(true);

  

  const getCafeById = (id: string) => {
    if (ListeCafes && ListeCafes.items) {
      const cafe = ListeCafes.items.find((cafe: any) => cafe.id === id);
      return cafe;
    }
    return null;
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

    // Fetch cafes
    const fetchCafes = async () => {
      try {
        const response = await fetchWithTimeout('https://cafesansfil-api-r0kj.onrender.com/api/cafes/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Cafes fetched:', data.items?.[0]);
        setListeCafes(data);
        setIsCafesLoading(false);
      } catch (error) {
        console.error('Error fetching cafes:', error);
        setIsCafesLoading(false);
        // Set empty data to prevent infinite loading
        setListeCafes({ items: [] });
      }
    };
    fetchCafes();
  
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
          setCafeFavoris(data.cafes);
        })
        .catch(error => console.error('Error fetching user data:', error));
    };

    fetchUserData();
  }, []);


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
          <View style={{ marginHorizontal: SPACING["md"] }}>
            <Text style={{ ...TYPOGRAPHY.body.normal.base, color: '#666' }}>
              Ajoutez des cafés à vos favoris pour les retrouver ici !
            </Text>
          </View>
        ) : (
         <View style={{ marginHorizontal: SPACING["md"] }}>
            <Text style={{ ...TYPOGRAPHY.body.normal.base, color: '#666' }}>
              À implémenter
            </Text>
          </View>
        )}

         <View>
          <Text 
            style={{
              marginVertical: SPACING["xl"], 
              marginHorizontal: SPACING["md"], 
              ...TYPOGRAPHY.heading.small.bold
            }}
            >Vos articles favoris</Text>
            <View style={{ marginHorizontal: SPACING["md"] }}>
            <Text style={{ ...TYPOGRAPHY.body.normal.base, color: '#666' }}>
              Ajoutez des articles à vos favoris pour les retrouver ici !
            </Text>
          </View>
        </View>
      </ScrollableLayout>
    </>
  );
}