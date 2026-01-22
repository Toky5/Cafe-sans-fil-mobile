import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import SPACING from "@/constants/Spacing";
import TYPOGRAPHY from "@/constants/Typography";
import COLORS from "@/constants/Colors";
import AnnouncementCard from "../common/Cards/AnnouncementCard";
import { Announcement } from "@/constants/types/GET_announcements";

type AnnouncementsModalLayoutProps = {
    visible: boolean;
    announcements: Announcement[];
    onClose: () => void;
};

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
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Toutes les annonces</Text>
                    <TouchableOpacity onPress={onClose}>
                        <AntDesign name="close" size={24} color={COLORS.black} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.modalContent}
                    showsVerticalScrollIndicator={false}
                >
                    {announcements.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Aucune annonce disponible</Text>
                        </View>
                    ) : (
                        announcements.map((announcement) => (
                            <View key={announcement.id} style={styles.cardContainer}>
                                <AnnouncementCard announcement={announcement} />
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: COLORS.black,
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    cardContainer: {
        marginBottom: SPACING.md,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: SPACING.xl * 2,
    },
    emptyText: {
        ...TYPOGRAPHY.body.large.base,
        color: COLORS.subtuleDark,
        textAlign: "center",
    },
});
