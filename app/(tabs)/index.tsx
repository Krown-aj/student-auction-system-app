import CategoryList from '@/components/CategoryList';
import ItemCard from '@/components/ItemCard';
import { MOCK_ITEMS } from '@/constants';
import { RootState } from '@/lib/store';
import { useGetItemsQuery } from '@/lib/store/api/itemsApi';
import { setSpinner } from '@/lib/store/slice/spinnerSlice';
import { Item } from '@/types/auction';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

export default function HomeScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const {
    data: items = [],
    isLoading,
    refetch,
  } = useGetItemsQuery(
  /* no arg: */ undefined,
    {
      // poll every 10 seconds
      pollingInterval: 10000,
      // refetch on app focus
      refetchOnFocus: true,
      // refetch when reconnecting to the network
      refetchOnReconnect: true,
    }
  );

  useEffect(() => {
    const beforeRemove = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
    });
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    return () => {
      beforeRemove();
      backHandler.remove();
    };
  }, [navigation]);

  useEffect(() => {
    if (isLoading) {
      dispatch(setSpinner({ visibility: true }));
    } else {
      dispatch(setSpinner({ visibility: false }));
    }
  }, [isLoading, dispatch]);

  const handleSelectCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleItemPress = (itemId: string) => {
    router.push({ pathname: '/item/[id]', params: { id: itemId } });
  };

  const handleFavoritePress = (itemId: string) => {
    setFavorites((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  let resolvedItems: Item[] = [];

  if (Array.isArray(items)) {
    resolvedItems = items;
  } else if ('ids' in items && 'entities' in items) {
    resolvedItems = (items.ids as string[])
      .map(id => items.entities[id]!)
      .filter(Boolean);
  }

  const itemsArray: Item[] =
    resolvedItems.length > 0
      ? resolvedItems
      : MOCK_ITEMS;

  const generalItems = itemsArray.filter(
    (item: Item) =>
      typeof item.seller === 'object' &&
      item.seller !== null &&
      '_id' in item.seller &&
      item.seller._id !== user?._id
  );

  const filteredItems = selectedCategory
    ? generalItems.filter((item: Item) => item.category.toLowerCase() === selectedCategory.toLowerCase())
    : generalItems;

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
      <LinearGradient colors={['#6366F1', '#7E84F2']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'Student'}</Text>
            <Text style={styles.campusText}>{`${user?.campus} Campus` || 'Lafia University'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#FFFFFF" />
            {/*  <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>3</Text>
            </View> */}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <CategoryList
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading auctions...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/7821590/pexels-photo-7821590.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
              style={styles.emptyImage}
            />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyText}>
              There are no auctions in this category yet.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/create')}
            >
              <Text style={styles.createButtonText}>Create Listing</Text>
            </TouchableOpacity>
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
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  campusText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F43F5E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,

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
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 24,
    borderRadius: 75,
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
