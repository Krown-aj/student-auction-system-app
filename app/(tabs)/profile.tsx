import ItemCard from '@/components/ItemCard';
import { images } from '@/constants';
import { RootState } from '@/lib/store';
import { useGetItemsQuery } from '@/lib/store/api/itemsApi';
import { Item, User } from '@/types/auction';
import { router } from 'expo-router';
import { Heart, LogOut, Package, Settings } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';

type ProfileTab = 'listings' | 'favorites';

export default function ProfileScreen() {
    // pull the logged-in user from Redux
    const user = useSelector((state: RootState) => state.auth.user as User);

    const [activeTab, setActiveTab] = useState<ProfileTab>('listings');

    // load all items
    const { data: itemsRaw = [], isLoading: itemsLoading } = useGetItemsQuery();

    // flatten EntityState or array → Item[]
    const items: Item[] = useMemo(() => {
        if (Array.isArray(itemsRaw)) return itemsRaw;
        if ('ids' in itemsRaw && 'entities' in itemsRaw) {
            return (itemsRaw.ids as string[])
                .map((id) => itemsRaw.entities[id]!)
                .filter(Boolean);
        }
        return [];
    }, [itemsRaw]);

    // My listings: where seller._id === user._id
    const userItems = useMemo(
        () => items.filter((it) => typeof it.seller === 'object' && it.seller !== null && '_id' in it.seller && (it.seller as User)._id === user._id),
        [items, user._id]
    );

    // Favorites: assuming user.favoriteIds: string[]
    const favoriteItems = useMemo(
        () =>
            items.filter((it) => typeof it.seller === 'object' && it.seller !== null && '_id' in it.seller && (it.seller as User)._id === user._id),
        [items, user._id]
    );

    const handleItemPress = (id: string) =>
        router.push({ pathname: '/item/[id]', params: { id } });

    const handleLogout = () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: () => router.push('/login'),
                },
            ],
            { cancelable: true }
        );
    };

    const renderTabContent = () => {
        const list = activeTab === 'listings' ? userItems : favoriteItems;
        if (list.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>
                        {activeTab === 'listings' ? 'No listings yet' : 'No favorites yet'}
                    </Text>
                    <Text style={styles.emptyText}>
                        {activeTab === 'listings'
                            ? 'Items you list for auction will appear here'
                            : 'Items you save will appear here'}
                    </Text>
                    {activeTab === 'listings' && (
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push('/create')}
                        >
                            <Text style={styles.createButtonText}>Create Listing</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }

        return (
            <View style={styles.itemsContainer}>
                {list.map((it) => (
                    <ItemCard
                        key={it._id}
                        item={it}
                        onPress={() => handleItemPress(it._id)}
                    />
                ))}
            </View>
        );
    };

    if (itemsLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading profile...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <View style={{ width: 24 }} />
                        <Text style={styles.headerTitle}>Profile</Text>
                        <TouchableOpacity style={styles.settingsButton}>
                            <Settings size={24} strokeWidth={2} stroke="#1F2937" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.profileContainer}>
                        <Image source={images.profile} style={styles.avatar} />
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userCampus}>{user.campus} Campus</Text>
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{userItems.length}</Text>
                                <Text style={styles.statLabel}>Listings</Text>
                            </View>
                            <View style={[styles.statItem, styles.statDivider]}>
                                <Text style={styles.statValue}>
                                    {userItems.reduce((sum, it) => sum + it.bids.length, 0)}
                                </Text>
                                <Text style={styles.statLabel}>Bids Received</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{favoriteItems.length}</Text>
                                <Text style={styles.statLabel}>Favorites</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'listings' && styles.activeTabButton,
                        ]}
                        onPress={() => setActiveTab('listings')}
                    >
                        <Package
                            size={20}
                            strokeWidth={2}
                            stroke={activeTab === 'listings' ? '#6366F1' : '#6B7280'}
                        />
                        <Text
                            style={[
                                styles.tabButtonText,
                                activeTab === 'listings' && styles.activeTabButtonText,
                            ]}
                        >
                            My Listings
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'favorites' && styles.activeTabButton,
                        ]}
                        onPress={() => setActiveTab('favorites')}
                    >
                        <Heart
                            size={20}
                            strokeWidth={2}
                            stroke={activeTab === 'favorites' ? '#6366F1' : '#6B7280'}
                        />
                        <Text
                            style={[
                                styles.tabButtonText,
                                activeTab === 'favorites' && styles.activeTabButtonText,
                            ]}
                        >
                            Favorites
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                {renderTabContent()}

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={20} strokeWidth={2} stroke="#F43F5E" />
                    <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontFamily: 'Inter-Medium', fontSize: 16, color: '#6B7280' },
    header: {
        backgroundColor: '#FFFFFF',
        paddingTop: 60,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    headerTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#1F2937' },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileContainer: { alignItems: 'center' },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
    userName: { fontFamily: 'Inter-Bold', fontSize: 24, color: '#1F2937', marginBottom: 4 },
    userCampus: { fontFamily: 'Inter-Regular', fontSize: 16, color: '#6B7280', marginBottom: 16 },
    statsContainer: {
        flexDirection: 'row',
        width: '80%',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F3F4F6' },
    statValue: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#1F2937', marginBottom: 4 },
    statLabel: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#6B7280' },
    tabsContainer: { flexDirection: 'row', marginTop: 16, marginHorizontal: 16, marginBottom: 16 },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabButton: { borderBottomColor: '#6366F1' },
    tabButtonText: { fontFamily: 'Inter-Medium', fontSize: 16, color: '#6B7280', marginLeft: 8 },
    activeTabButtonText: { color: '#6366F1' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 24 },
    emptyTitle: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#1F2937', marginBottom: 8 },
    emptyText: { fontFamily: 'Inter-Regular', fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
    createButton: { backgroundColor: '#6366F1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    createButtonText: { fontFamily: 'Inter-Bold', fontSize: 16, color: '#FFFFFF' },
    itemsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 40, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
    logoutButtonText: { fontFamily: 'Inter-Medium', fontSize: 16, color: '#F43F5E', marginLeft: 8 },
});
