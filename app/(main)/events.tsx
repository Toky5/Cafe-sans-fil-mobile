import { View, Text, Touchable, TouchableOpacity, Modal, Platform, Linking, Alert } from 'react-native';
import React, { use, useEffect } from 'react';
import ScrollableLayout from '@/components/layouts/ScrollableLayout';
import SPACING from '@/constants/Spacing';
import TYPOGRAPHY from "@/constants/Typography";
import HeaderLayout from '@/components/layouts/HeaderLayout';
import MapView, { Marker } from 'react-native-maps';

export default function EventsPage() {

  const [laliste, setLaliste] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRequestingData, setIsRequestingData] = React.useState(false);

  const [ListeCafes, setListeCafes] = React.useState<any>(null);

  const [isCafesLoading, setIsCafesLoading] = React.useState(true);
  const [modalData, setModalData] = React.useState<any>(null);

  const [setCafeRegion, setSetCafeRegion] = React.useState<any>(null);

  const [cafeLocation, setCafeLocation] = React.useState<any>(null);

  const getCafeNameById = (id: string) => {
    if (ListeCafes && ListeCafes.items) {
      const cafe = ListeCafes.items.find((cafe: any) => cafe.id === id);
      return cafe ? cafe.name : 'Unknown Cafe';
    }
    return 'Loading...';
  }

  const openMapNavigation = async (cafe: any) => {
    const latitude = cafe.location.geometry.coordinates[1];
    const longitude = cafe.location.geometry.coordinates[0];
    const cafeName = cafe.name;
    
    if (Platform.OS === 'android') {
      // Android: Open Google Maps directly
      const googleMapsUrl = `google.navigation:q=${latitude},${longitude}`;
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      
      try {
        const supported = await Linking.canOpenURL(googleMapsUrl);
        if (supported) {
          await Linking.openURL(googleMapsUrl);
        } else {
          await Linking.openURL(fallbackUrl);
        }
      } catch (error) {
        console.error('Error opening maps:', error);
      }
    } else {
      // iOS: Check if Google Maps is installed
      const googleMapsUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
      const appleMapsUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
      
      try {
        const googleMapsInstalled = await Linking.canOpenURL(googleMapsUrl);
        
        if (googleMapsInstalled) {
          // Show choice between Apple Maps and Google Maps
          Alert.alert(
            'Ouvrir dans',
            `Choisissez l'application pour naviguer vers ${cafeName}`,
            [
              {
                text: 'Apple Maps',
                onPress: () => Linking.openURL(appleMapsUrl)
              },
              {
                text: 'Google Maps',
                onPress: () => Linking.openURL(googleMapsUrl)
              },
              {
                text: 'Annuler',
                style: 'cancel'
              }
            ]
          );
        } else {
          // Only Apple Maps available
          await Linking.openURL(appleMapsUrl);
        }
      } catch (error) {
        console.error('Error opening maps:', error);
        // Fallback to Apple Maps
        await Linking.openURL(appleMapsUrl);
      }
    }
  };

  const getCafeById = (id: string) => {
    if (ListeCafes && ListeCafes.items) {
      const cafe = ListeCafes.items.find((cafe: any) => cafe.id === id);
      return cafe;
    }
    return null;
  }

  const updateCafeRegion = (cafeId: string) => {
    const cafe = getCafeById(cafeId);
    if (cafe && cafe.location && cafe.location.geometry) {
      return {
        latitude: cafe.location.geometry.coordinates[1],
        longitude: cafe.location.geometry.coordinates[0],
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    // Default region if cafe not found
    return {
      latitude: 45.5017,
      longitude: -73.5673,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const openModalWithData = (data: any) => {
    setModalData(data);
    setShowModal(true);
  }

  const [showModal, setShowModal] = React.useState(false);
  


  useEffect(() => {
    // Prevent multiple simultaneous requests
    if (isRequestingData) return;
    
    setIsRequestingData(true);
    
    const fetchWithTimeout = (url: string, timeout = 10000): Promise<Response> => {
      return Promise.race([
        fetch(url),
        new Promise<Response>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ]);
    };

    // Fetch announcements
    const fetchAnnouncements = async () => {
      try {
        const response = await fetchWithTimeout('https://cafesansfil-api-r0kj.onrender.com/api/announcements/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Announcements fetched:', data.items?.[0]);
        setLaliste(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setIsLoading(false);
        // Set empty data to prevent infinite loading
        setLaliste({ items: [] });
      }
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

    // Execute both requests
    Promise.all([fetchAnnouncements(), fetchCafes()])
      .finally(() => {
        setIsRequestingData(false);
      });

  }, []); // Empty dependency array to run only once

  const displayAnnouncement = (announcement : any) => {
    return (
      <TouchableOpacity key={announcement.id} onPress={() => {
        openModalWithData(announcement);
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: SPACING["lg"],
          marginBottom: SPACING["md"],
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          borderWidth: 1,
          borderColor: '#F0F0F0'
        }}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING["sm"]}}>
            <Text style={{...TYPOGRAPHY.body.large.semiBold, flex: 1, marginRight: SPACING["sm"]}}>{announcement.title}</Text>
            {announcement.tags && announcement.tags.length > 0 && (
              <View style={{
                backgroundColor: '#E8F4FD',
                paddingHorizontal: SPACING["sm"],
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Text style={{...TYPOGRAPHY.body.small.base, color: '#1976D2', fontSize: 10}}>
                  {announcement.tags[0]}
                </Text>
              </View>
            )}
          </View>
          <Text 
            style={{...TYPOGRAPHY.body.normal.base, color: '#666', marginBottom: SPACING["sm"], lineHeight: 18}}
            numberOfLines={2}
          >
            {announcement.content}
          </Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <View style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#4CAF50',
                marginRight: SPACING["xs"]
              }} />
              <Text style={{...TYPOGRAPHY.body.small.base, color: '#666'}}>
                {getCafeNameById(announcement.cafe_id)}
              </Text>
            </View>
            <Text style={{...TYPOGRAPHY.body.small.base, color: '#999'}}>
              {new Date(announcement.active_until).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <>
    <HeaderLayout />
      <ScrollableLayout>
        <View>
          <Text 
            style={{
              marginVertical: SPACING["xl"], 
              marginHorizontal: SPACING["md"], 
              ...TYPOGRAPHY.heading.small.bold
            }}
            >Évenements</Text>

          <View style={{marginHorizontal: SPACING["md"]}}>
            {isLoading ? (
              <Text>Loading...</Text>
            ) : (
              laliste && laliste.items && laliste.items.map((announcement: any) => displayAnnouncement(announcement))
            )}
            <Modal visible={showModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowModal(false)}
            >
              <View style={{
                flex: 1,
                justifyContent: 'flex-end',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              }}>
                <View style={{
                  width: '100%',
                  height: '90%',
                  backgroundColor: '#fff',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                }}>
                  {/* Modal Header */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: SPACING["lg"],
                    paddingTop: SPACING["lg"],
                    paddingBottom: SPACING["md"],
                    borderBottomWidth: 1,
                    borderBottomColor: '#F0F0F0'
                  }}>
                    <View style={{
                      width: 40,
                      height: 4,
                      backgroundColor: '#E0E0E0',
                      borderRadius: 2,
                      position: 'absolute',
                      top: 8,
                      left: '50%',
                      marginLeft: -20
                    }} />
                    <Text style={{...TYPOGRAPHY.heading.small.bold}}>Détails de l'événement</Text>
                    <TouchableOpacity 
                      onPress={() => setShowModal(false)} 
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#F5F5F5',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{...TYPOGRAPHY.body.large.semiBold, color: '#666'}}>×</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Modal Content */}
                  {modalData && (
                    <View style={{flex: 1, paddingHorizontal: SPACING["lg"]}}>
                      {/* Title and Tags */}
                      <View style={{marginTop: SPACING["lg"]}}>
                        <Text style={{...TYPOGRAPHY.heading.medium.bold, marginBottom: SPACING["sm"], lineHeight: 28}}>
                          {modalData.title}
                        </Text>
                        {modalData.tags && modalData.tags.length > 0 && (
                          <View style={{flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING["lg"]}}>
                            {modalData.tags.slice(0, 4).map((tag: string, index: number) => (
                              <View key={index} style={{
                                backgroundColor: '#E8F4FD',
                                paddingHorizontal: SPACING["sm"],
                                paddingVertical: 6,
                                borderRadius: 16,
                                marginRight: SPACING["xs"],
                                marginBottom: SPACING["xs"]
                              }}>
                                <Text style={{...TYPOGRAPHY.body.small.base, color: '#1976D2'}}>
                                  {tag}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Event Info Cards */}
                      <View style={{marginBottom: SPACING["lg"]}}>
                        <View style={{
                          backgroundColor: '#F8F9FA',
                          borderRadius: 12,
                          padding: SPACING["md"],
                          marginBottom: SPACING["sm"]
                        }}>
                          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: SPACING["xs"]}}>
                            <View style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#4CAF50',
                              marginRight: SPACING["sm"]
                            }} />
                            <Text style={{...TYPOGRAPHY.body.normal.semiBold, color: '#333'}}>Café</Text>
                          </View>
                          <Text style={{...TYPOGRAPHY.body.normal.base, color: '#666', marginBottom: SPACING["sm"]}}>
                            {getCafeNameById(modalData.cafe_id)}
                          </Text>
                          
                          {getCafeById(modalData.cafe_id) && (
                            <MapView 
                              style={{
                                width:'100%',
                                height:150,
                                borderRadius:10,
                                marginTop: SPACING["sm"]
                              }} 
                              initialRegion={updateCafeRegion(modalData.cafe_id)}
                              scrollEnabled={false}
                              zoomEnabled={false}
                              rotateEnabled={false}
                              pitchEnabled={false}
                              onPress={() => openMapNavigation(getCafeById(modalData.cafe_id))}
                            >
                              <Marker
                                coordinate={{
                                  latitude: getCafeById(modalData.cafe_id).location.geometry.coordinates[1],
                                  longitude: getCafeById(modalData.cafe_id).location.geometry.coordinates[0]
                                }}
                                title={getCafeNameById(modalData.cafe_id)}
                                description={getCafeById(modalData.cafe_id).location.pavillon}
                                onPress={() => openMapNavigation(getCafeById(modalData.cafe_id))}
                              />
                            </MapView>
                          )}
                        </View>

                        <View style={{
                          backgroundColor: '#F8F9FA',
                          borderRadius: 12,
                          padding: SPACING["md"],
                          marginBottom: SPACING["sm"]
                        }}>
                          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: SPACING["xs"]}}>
                            <View style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#FF9800',
                              marginRight: SPACING["sm"]
                            }} />
                            <Text style={{...TYPOGRAPHY.body.normal.semiBold, color: '#333'}}>Date limite</Text>
                          </View>
                          <Text style={{...TYPOGRAPHY.body.normal.base, color: '#666'}}>
                            {new Date(modalData.active_until).toLocaleDateString('fr-FR', { 
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Text>
                        </View>

                        {modalData.author && (
                          <View style={{
                            backgroundColor: '#F8F9FA',
                            borderRadius: 12,
                            padding: SPACING["md"]
                          }}>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: SPACING["xs"]}}>
                              <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#2196F3',
                                marginRight: SPACING["sm"]
                              }} />
                              <Text style={{...TYPOGRAPHY.body.normal.semiBold, color: '#333'}}>Organisé par</Text>
                            </View>
                            <Text style={{...TYPOGRAPHY.body.normal.base, color: '#666'}}>
                              {modalData.author.first_name} {modalData.author.last_name}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Description */}
                      <View style={{flex: 1}}>
                        <Text style={{...TYPOGRAPHY.body.normal.semiBold, color: '#333', marginBottom: SPACING["sm"]}}>
                          Description
                        </Text>
                        <Text style={{...TYPOGRAPHY.body.normal.base, color: '#666', lineHeight: 22}}>
                          {modalData.content}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </Modal>

            
           
          </View>
            
        </View>
      </ScrollableLayout>
    </>
  );
}