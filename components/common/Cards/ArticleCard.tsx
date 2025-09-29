import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Circle } from "lucide-react-native";
import { router } from "expo-router";
import { StyleProp, ViewStyle } from "react-native";

import TYPOGRAPHY from "@/constants/Typography";
import COLORS from "@/constants/Colors";
import SPACING from "@/constants/Spacing";
import React from "react";

type ArticleCardProps = {
  status: "En Stock" | "Almost Out" | "En Rupture";

  /** The name of the article */
  name: string;

  /** The calories of the article */
  calories?: string;

  /** The price range of the article */
  price: string;

  /** The rating of the article */
  rating?: number;

  /** The image of the article */
  image?: string;

  /** The size of the card */
  size?: "medium" | "large";

  /** The slug of the article */
  slug?: string;

  /** The slug of the cafe */
  cafeSlug?: string;

  /** Additional styles for the card */
  style?: StyleProp<ViewStyle>;
};
const formatPrice = (price: string) => {
  if (price.charAt(price.length - 2) == ".") {
    return price + "0";
  }
  else{
    return price
  }
}

let cardDimensions = {
  medium: {
    width: "100%",
    height: 135,
    image: require("@/assets/images/placeholder/imagesm.png"),
  },
  large: {
    width: 160,
    height: 108,
    image: require("@/assets/images/placeholder/imagexs.png"),
  },
};

/**
 * ## articleCard Component
 *
 * A reusable card component that displays information about a article, including its name, calories,
 * price range, rating, and status. The card also includes an image and supports navigation to the
 * article's details page when pressed.
 *
 * ### Example Usage
 *
 * ```tsx
 * <articleCard
 *   status="open"
 *   name="Cozy Coffee"
 *   calories="123 Coffee Lane"
 *   price="$$"
 *   rating={4.5}
 *   image="https://example.com/image.jpg"
 *   size="large"
 *   slug="cozy-coffee"
 * />
 * ```
 *
 * @param {ArticleCardProps} props - The props for the articleCard component.
 */
export default function ArticleCard({
  status,
  name,
  calories,
  price,
  image,
  size = "medium",
  cafeSlug = "INVALID_SLUG",
  slug = "INVALID_SLUG",
  style,
}: ArticleCardProps) {
  return (
    <Pressable
      onPress={() => router.push(`/cafe/${cafeSlug}/${slug}`)}
      style={[styles.menuItemCard, style]}
    >
      <Image 
        source={image ? { uri: image } : cardDimensions[size].image}
        style={styles.menuItemImage}
        resizeMode="cover"
      />
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{name}</Text>
        <Text style={styles.menuItemDescription}>
          {calories || "Délicieux plat préparé avec soin et des ingrédients frais."}
        </Text>
        <Text style={styles.menuItemPrice}>{formatPrice(price)}</Text>
        <View style={styles.statusIndicator}>
          <Circle
            width={8}
            height={8}
            strokeWidth={0}
            fill={
              status === "En Stock"
                ? COLORS.status.green
                : status === "Almost Out"
                ? COLORS.status.orange
                : COLORS.status.red
            }
          />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Horizontal Menu Card Styles
  menuItemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 180,
  },
  menuItemImage: {
    width: '60%',
    height: 180,
  },
  menuItemContent: {
    flex: 1,
    padding: SPACING["md"],
    justifyContent: 'space-between',
  },
  menuItemTitle: {
    ...TYPOGRAPHY.heading.small.bold,
    color: COLORS.black,
    marginBottom: SPACING["xs"],
  },
  menuItemDescription: {
    ...TYPOGRAPHY.body.small.base,
    color: COLORS.subtuleDark,
    lineHeight: 18,
    marginBottom: SPACING["sm"],
    flex: 1,
  },
  menuItemPrice: {
    ...TYPOGRAPHY.body.large.semiBold,
    color: COLORS.black,
    marginBottom: SPACING["xs"],
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    ...TYPOGRAPHY.body.small.base,
    color: COLORS.subtuleDark,
    fontSize: 12,
  },
  // Legacy styles (keeping for backward compatibility)
  caption: {
    justifyContent: "space-between",
    marginTop: SPACING["lg"],
    flexDirection: "row",
    alignItems: "flex-end",
  },
  articleInfo: {
    gap: 6,
  },
  priceContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  articleInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING["xs"],
  },
  articleInfocalories: {
    color: COLORS.black45,
  },
  priceIcon: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    justifyContent: "center",
    borderRadius: 500,
  },
  rating: {
    position: "absolute",
    right: SPACING.sm,
    top: SPACING.sm,
  },
  wrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3, 
  },
  priceText: {
    color: COLORS.black,
    fontSize: 16,
  },
});
