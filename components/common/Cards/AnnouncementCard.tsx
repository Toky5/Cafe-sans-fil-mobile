import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Coffee, MapPin } from "lucide-react-native";
import COLORS from "@/constants/Colors";
import SPACING from "@/constants/Spacing";
import TYPOGRAPHY from "@/constants/Typography";
import { Announcement } from "@/constants/types/GET_announcements";

type AnnouncementCardProps = {
    announcement: Announcement;
    onPress?: () => void;
    compact?: boolean;
};

/**
 * AnnouncementCard Component
 * 
 * Displays an announcement with title, content, cafe name, and timestamp
 */
export default function AnnouncementCard({
    announcement,
    onPress,
    compact = false
}: AnnouncementCardProps) {
    const [cafeName, setCafeName] = useState<string>("");

    useEffect(() => {
        // Fetch cafe name based on cafe_id
        if (announcement.cafe_id) {
            fetch(`https://api.cafesansfil.ca/v1/cafes/${announcement.cafe_id}`)
                .then((response) => response.json())
                .then((cafe) => setCafeName(cafe.name))
                .catch((error) => console.error("Error fetching cafe:", error));
        }
    }, [announcement.cafe_id]);

    const formattedDate = new Date(announcement.created_at).toLocaleDateString('fr-CA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const CardWrapper = onPress ? TouchableOpacity : View;
    const cardProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

    return (
        <CardWrapper {...cardProps} style={[styles.container, compact && styles.compactContainer]}>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
                        {announcement.title}
                    </Text>
                    <Text style={styles.date}>{formattedDate}</Text>
                </View>
            </View>

            <Text
                style={styles.content}
                numberOfLines={compact ? 2 : undefined}
            >
                {announcement.content}
            </Text>

            {announcement.tags && announcement.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                    {announcement.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            )}

            {cafeName && (
                <View style={styles.cafeContainer}>
                    <Coffee size={16} color={COLORS.subtuleDark} />
                    <Text style={styles.cafeName}>
                        {cafeName}
                    </Text>
                </View>
            )}
        </CardWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        shadowColor: COLORS.black,
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 20,
    },
    compactContainer: {
        padding: SPACING.sm,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: SPACING.sm,
    },
    headerText: {
        flex: 1,
    },
    title: {
        ...TYPOGRAPHY.heading.small.bold,
        color: COLORS.black,
        marginBottom: 2,
    },
    date: {
        ...TYPOGRAPHY.body.small.base,
        color: COLORS.subtuleDark,
    },
    content: {
        ...TYPOGRAPHY.body.normal.base,
        color: COLORS.black,
        lineHeight: 20,
        marginBottom: SPACING.sm,
    },
    tagsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: SPACING.xs,
        marginBottom: SPACING.xs,
    },
    tag: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        ...TYPOGRAPHY.body.small.base,
        color: COLORS.primary,
        fontSize: 11,
    },
    cafeContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: SPACING.xs,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        gap: SPACING.xs,
    },
    cafeName: {
        ...TYPOGRAPHY.body.small.base,
        color: COLORS.subtuleDark,
    },
});
