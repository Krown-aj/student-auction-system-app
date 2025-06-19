import ItemCard from '@/components/ItemCard';
import { RootState } from '@/lib/store';
import { useGetItemsQuery } from '@/lib/store/api/itemsApi';
import { Item } from '@/types/auction';
import { router } from 'expo-router';
import { Filter, Search, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';

export default function SearchScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const { data: itemsRaw = [], isLoading } = useGetItemsQuery();
    const user = useSelector((state: RootState) => state.auth.user);

    // Normalize items
    const items = useMemo<Item[]>(() => {
        if (Array.isArray(itemsRaw)) return itemsRaw;
        if ('ids' in itemsRaw && 'entities' in itemsRaw) {
            return (itemsRaw.ids as string[])
                .map((id) => itemsRaw.entities[id]!)
                .filter(Boolean);
        }
        return [];
    }, [itemsRaw]);

    // Filter out own items
    const generalItems = useMemo(
        () =>
            items.filter(
                (item) =>
                    typeof item.seller === 'object' &&
                    item.seller !== null &&
                    '_id' in item.seller &&
                    item.seller._id !== user?._id
            ),
        [items, user?._id]
    );

    // State for filtered results
    const [filteredItems, setFilteredItems] = useState<Item[]>(generalItems);

    // Debounce timer
    const debounceTimer = useRef<number | null>(null);

    // Real-time search effect
    useEffect(() => {
        // Clear previous timer
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        setLoading(true);
        debounceTimer.current = setTimeout(() => {
            const query = searchQuery.trim().toLowerCase();
            if (!query) {
                setFilteredItems(generalItems);
            } else {
                const results = items.filter((item) =>
                    [item.title, item.description, item.category]
                        .join(' ')
                        .toLowerCase()
                        .includes(query)
                );
                setFilteredItems(results);
            }
            setLoading(false);
        }, 300);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [searchQuery, items, generalItems]);

    const clearSearch = () => {
        setSearchQuery('');
    };

    const handleItemPress = (itemId: string) => {
        router.push({ pathname: '/item/[id]', params: { id: itemId } });
    };

    const [favorites, setFavorites] = useState<string[]>([]);
    const handleFavoritePress = (itemId: string) => {
        setFavorites((prev) =>
            prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
        );
    };

    const [filtersVisible, setFiltersVisible] = useState(false);

    const renderItem = ({ item }: { item: Item }) => (
        <ItemCard
            item={item}
            onPress={handleItemPress}
            onFavorite={handleFavoritePress}
            isFavorite={favorites.includes(item._id)}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Search Items</Text>
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={20} strokeWidth={2} stroke="#6B7280" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name, description, or category"
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                                <X size={18} strokeWidth={2} stroke="#6B7280" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setFiltersVisible((v) => !v)}
                    >
                        <Filter size={20} strokeWidth={2} stroke="#6366F1" />
                    </TouchableOpacity>
                </View>

                {filtersVisible && (
                    <View style={styles.filtersContainer}>
                        {/* ... filter controls ... */}
                        <Text style={styles.filterTitle}>Price Range</Text>
                        <TouchableOpacity style={styles.applyButton}>
                            <Text style={styles.applyButtonText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {(isLoading || loading) ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingText}>Searching...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>No results found</Text>
                            <Text style={styles.emptyText}>
                                Try a different search term or browse all items
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: '#1F2937',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#1F2937',
        paddingVertical: 12,
    },
    clearButton: {
        padding: 6,
    },
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersContainer: {
        marginTop: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
    },
    filterTitle: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: '#4B5563',
        marginBottom: 8,
    },
    applyButton: {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    applyButtonText: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: '#6B7280',
        marginTop: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    listContent: {
        paddingTop: 16,
        paddingBottom: 24,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        marginTop: 40,
    },
    emptyTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: '#1F2937',
        marginBottom: 8,
    },
    emptyText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
});
