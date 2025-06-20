import { BASE_URL } from '@/constants';
import { formatPrice } from '@/lib/formatters';
import { Item } from '@/types/auction';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Heart } from 'lucide-react-native';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ItemCardProps {
    item: Item;
    onPress: (itemId: string) => void;
    onLongPress?: (itemId: string) => void;
    onFavorite?: (itemId: string) => void;
    isFavorite?: boolean;
    disabled?: boolean;
}

const { width } = Dimensions.get('window');

export default function ItemCard({ item, onPress, onLongPress, onFavorite, isFavorite = false, disabled }: ItemCardProps) {
    const timeLeft = formatDistanceToNow(new Date(item.enddate), { addSuffix: true });
    const isEnded = new Date(item.enddate) < new Date();

    const imageUrl = `${BASE_URL}/images/uploads/${item.images[0]}`

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress(item._id)}
            onLongPress={onLongPress ? () => onLongPress(item._id) : undefined}
            disabled={disabled}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                />
                {onFavorite && (
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={() => onFavorite(item._id)}
                    >
                        <Heart
                            size={20}
                            color={isFavorite ? '#F43F5E' : '#FFFFFF'}
                            fill={isFavorite ? '#F43F5E' : 'none'}
                        />
                    </TouchableOpacity>
                )}
                {item.status === 'Active' ? (
                    <View style={styles.statusContainer}>
                        <Clock size={14} color="#FFFFFF" />
                        <Text style={styles.statusText}>{timeLeft}</Text>
                    </View>
                ) : (
                    <View style={[styles.statusContainer, styles.endedContainer]}>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                )}
            </View>

            <View style={styles.detailsContainer}>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                    {item.title}
                </Text>

                <View style={styles.priceContainer}>
                    <Text style={[styles.price, { fontSize: 12 }]}>
                        ₦{item.currentprice ? formatPrice(item.currentprice) : formatPrice(item.startingprice)}
                    </Text>
                    {item.bids.length > 0 && (
                        <Text style={styles.bidsCount}>
                            {item.bids.length} bid{item.bids.length !== 1 ? 's' : ''}
                        </Text>
                    )}
                </View>

                <View style={styles.categoryRow}>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                    <View style={[styles.categoryBadge, styles.conditionBadge]}>
                        <Text style={styles.categoryText}>{item.condition}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width / 2 - 24,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 16,
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 160,
    },
    image: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    favoriteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusContainer: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
    },
    endedContainer: {
        backgroundColor: 'rgba(156, 163, 175, 0.8)',
    },
    statusText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: '#FFFFFF',
        marginLeft: 4,
    },
    detailsContainer: {
        padding: 12,
    },
    title: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: '#1F2937',
        marginBottom: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    price: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: '#6366F1',
    },
    bidsCount: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: '#6B7280',
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    categoryBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 4,
    },
    conditionBadge: {
        backgroundColor: '#F0FDFA',
    },
    categoryText: {
        fontFamily: 'Inter-Medium',
        fontSize: 10,
        color: '#4F46E5',
    },
});