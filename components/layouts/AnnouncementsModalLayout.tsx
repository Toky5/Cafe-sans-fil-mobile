import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Platform
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Coffee } from "lucide-react-native";
import SPACING from "@/constants/Spacing";
import TYPOGRAPHY from "@/constants/Typography";
import COLORS from "@/constants/Colors";
import { Announcement } from "@/constants/types/GET_announcements";

type AnnouncementsModalLayoutProps = {
    visible: boolean;
    announcements: Announcement[];
    onClose: () => void;
};

type AnnouncementItemProps = {
    announcement: Announcement;
};

/**
 * AnnouncementItem Component
 * 
 * Individual announcement item styled like notification items
 */
function AnnouncementItem({ announcement }: AnnouncementItemProps) {
    const [cafeName, setCafeName] = useState<string>("");

    useEffect(() => {
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

    return (
        <View style={styles.announcementBox}>
            <View style={styles.announcementDetails}>
                <Text style={styles.announcementTitle}>{announcement.title}</Text>
                <Text style={styles.announcementDate}>{formattedDate}</Text>
                <Text style={styles.announcementContent}>{announcement.content}</Text>
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
                    <View style={styles.cafeInfo}>
                        <Coffee size={14} color="#666" />
                        <Text style={styles.cafeName}>{cafeName}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

/**
 * AnnouncementsModalLayout Component
 * 
 * Modal layout to display all announcements in a scrollable view
 */
export default function AnnouncementsModalLayout({
    visible,
    announcements,
    onClose,
}: AnnouncementsModalLayoutProps) {
    return (
        <Modal
            animationType="slide"
            visible={visible}
            onRequestClose={onClose}
            presentationStyle="pageSheet"
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Toutes les annonces</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <AntDesign name="close" size={24} color={COLORS.black} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalContent}>
                        {announcements.length === 0 ? (
                            <View>
                                <Text style={styles.noAnnouncementsText}>Aucune annonce disponible</Text>
                            </View>
                        ) : (
                            <>
                                {announcements.map((announcement, index) => (
                                    <AnnouncementItem
                                        key={`${announcement.id}-${index}`}
                                        announcement={announcement}
                                    />
                                ))}
                            </>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.white,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        padding: 20,
        marginTop: Platform.OS === 'android' ? 15 : 0,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    announcementBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    announcementDetails: {
        flex: 1,
    },
    announcementTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: COLORS.black,
    },
    announcementDate: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
    },
    announcementContent: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        lineHeight: 20,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
        marginBottom: 4,
    },
    tag: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '500',
    },
    cafeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    cafeName: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    noAnnouncementsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
});
