import React, { useRef, useState, useEffect } from "react";
import { router } from "expo-router";
import {
    View,
    Text,
    StyleSheet,
    Image,
    StatusBar,
    ScrollView,
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TYPOGRAPHY from "@/constants/Typography";
import COLORS from "@/constants/Colors";
import SPACING from "@/constants/Spacing";
import Button from "@/components/common/Buttons/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const onboardingData = [
    {
        image: require("@/assets/images/onboarding/cafe_san_fil_2_v2.png"),
        title: "Tous vos cafés un coup d'œil",
        description:
            "Accédez facilement à toutes les options de restauration du campus en un seul endroit.",
    },
    {
        image: require("@/assets/images/onboarding/onboard1.png"),
        title: "Informations en temps réel",
        description:
            "Planifiez mieux votre visite en consultant les horaires d'ouverture et les emplacements des à proximité.",
    },
    {
        image: require("@/assets/images/onboarding/cafe_sans_fil_image3.png"),
        title: "Événements et promotions",
        description:
            "Restez informé des événements spéciaux, des ateliers et des promotions exclusives dans les cafés à proximité.",
    },
];

export default function OnboardingScreen() {
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        async function checkIfOnboarded() {
            const hasOnboarded = await AsyncStorage.getItem("hasOnboarded");
            console.log("Has onboarded:", hasOnboarded);
        }
        checkIfOnboarded();
    }, []);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const page = Math.round(offsetX / SCREEN_WIDTH);
        setCurrentPage(page);
    };

    const handleNext = async () => {
        if (currentPage < onboardingData.length - 1) {
            scrollViewRef.current?.scrollTo({
                x: (currentPage + 1) * SCREEN_WIDTH,
                animated: true,
            });
        } else {
            // Last page - set onboarded flag and navigate to sign-in
            await AsyncStorage.setItem("hasOnboarded", "true");
            router.navigate("/sign-in");
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem("hasOnboarded", "true");
        router.push("/sign-in");
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Page Indicator */}
            <View style={[styles.currentPage, { paddingTop: Platform.OS === 'ios' ? insets.top + 30 : insets.top + SPACING.xl }]}>
                {onboardingData.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.currentPageItem,
                            currentPage === index && styles.activePageItem,
                        ]}
                    />
                ))}
            </View>

            {/* Swipeable Content */}
            <View style={styles.scrollViewContainer}>
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    bounces={false}
                >
                    {onboardingData.map((item, index) => (
                        <View key={index} style={[styles.pageContainer, { width: SCREEN_WIDTH }]}>
                            <View style={styles.imageContainer}>
                                <Image
                                    source={item.image}
                                    style={styles.image}
                                    resizeMode="contain"
                                />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[TYPOGRAPHY.heading.medium.bold, styles.heading]}>
                                    {item.title}
                                </Text>
                                <Text style={[TYPOGRAPHY.body.large.base, styles.description]}>
                                    {item.description}
                                </Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Buttons - Fixed at bottom */}
            <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
                <Button onPress={handleNext}>
                    {currentPage === onboardingData.length - 1 ? "Suivant" : "Suivant"}
                </Button>
                <Button onPress={handleSkip} type="secondary">
                    Sauter
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollViewContainer: {
        flex: 1,
    },
    currentPage: {
        paddingTop: SPACING["2xl"],
        paddingBottom: SPACING.lg,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: SPACING["xl"],
        gap: SPACING.xs,
    },
    currentPageItem: {
        flex: 1,
        height: 4,
        backgroundColor: "#DEDEDE",
        borderRadius: 4,
        maxWidth: 100,
    },
    activePageItem: {
        backgroundColor: COLORS.black,
    },
    pageContainer: {
        flex: 1,
        justifyContent: "space-between",
        paddingHorizontal: SPACING.lg,
    },
    imageContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: SPACING.xl,
        minHeight: SCREEN_HEIGHT * 0.35,
        maxHeight: SCREEN_HEIGHT * 0.45,
    },
    image: {
        width: "100%",
        height: "100%",
        maxWidth: 350,
    },
    textContainer: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xl,
        gap: SPACING.md,
    },
    heading: {
        textAlign: "center",
        color: COLORS.black,
    },
    description: {
        textAlign: "center",
        color: COLORS.subtuleDark,
        lineHeight: 22,
    },
    buttonContainer: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        gap: SPACING.sm,
        backgroundColor: "#fff",
    },
});
