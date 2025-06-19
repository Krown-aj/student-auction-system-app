import { BASE_URL, images } from '@/constants';
import { formatPrice } from '@/lib/formatters';
import { RootState } from '@/lib/store';
import { useAddNewBidMutation } from '@/lib/store/api/bidsApi';
import { useGetItemsQuery } from '@/lib/store/api/itemsApi';
import { setSpinner } from '@/lib/store/slice/spinnerSlice';
import { Item } from '@/types/auction';
import { format, formatDistanceToNow } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, ArrowLeft, Clock, Heart, MessageCircle, User } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Dimensions, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

export default function ItemDetailScreen() {
    const { id } = useLocalSearchParams();
    const { data, isLoading } = useGetItemsQuery();
    const user = useSelector((state: RootState) => state.auth.user);
    const item = data?.entities[id as string] as Item | undefined;
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [bidAmount, setBidAmount] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addNewBid] = useAddNewBidMutation();
    const dispatch = useDispatch()

    const owner =
        typeof item?.seller === 'object' &&
        item.seller !== null &&
        '_id' in item.seller &&
        typeof item.seller._id === 'string' &&
        item.seller._id === user?._id;

    const handlePlaceBid = async () => {
        setError(null);
        let type = 'Error'
        let text = 'An error occured while placing bid. Please try again!'

        dispatch(setSpinner({ visibility: true }))
        if (!bidAmount.trim()) {
            setError('Please enter a bid amount');
            return;
        }

        const amount = parseFloat(bidAmount);
        if (isNaN(amount)) {
            setError('Please enter a valid amount');
            return;
        }

        if (item && amount <= item.currentprice) {
            setError(`Bid must be higher than the current bid (₦${item.currentprice.toFixed(2)})`);
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                item: item?._id,
                bidder: user?._id,
                amount,
                createdAt: new Date().toISOString(),
            }
            const result = await addNewBid(payload);
            const error = result.error;
            if (!error) {
                const { status, message } = result.data
                if (status === 'SUCCESS') {
                    type = 'Success'
                    text = 'Bid placed successfully!'
                } else {
                    text = message || 'An error occurred while placing bid. Please try again!'
                    setError(message);
                }
            } else {
                if (
                    typeof error === 'object' &&
                    error !== null &&
                    'data' in error &&
                    typeof (error as any).data === 'object' &&
                    (error as any).data !== null &&
                    'message' in (error as any).data
                ) {
                    text = (error as any).data.message || 'An error occured while placing bid. Please try again.';
                } else {
                    text = 'An error occured while placing bid. Please try again.';
                }
            }
        } catch (error) {
            console.error('Error placing bid:', error);
            text = `An error occured while placing bid. Please try again!`
        } finally {
            setTimeout(() => {
                dispatch(setSpinner({ visibility: false }))
                setBidAmount('');
                setIsSubmitting(false);
                if (type === 'Success') {
                    Alert.alert(
                        'Placing Bid',
                        text,
                        [
                            {
                                text: 'OK',
                            },
                        ],
                        { cancelable: false }
                    )
                } else {
                    Alert.alert('Placing Bid', text)
                }
            }, 3000)
        }
    };

    const handleContactSeller = () => {
        if (item && typeof item.seller === 'object' && item.seller !== null && '_id' in item.seller) {
            router.push({ pathname: '/conversation/[id]', params: { id: item.seller._id } });
        }
    };

    const handleContactBidder = (bidder: string) => {
        router.push({ pathname: '/conversation/[id]', params: { id: bidder } });
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
    };

    const formatBidDate = (dateValue: string | Date) => {
        const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
        return format(date, 'MMM d, yyyy \'at\' h:mm a');
    };

    if (isLoading || !item) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading item details...</Text>
            </SafeAreaView>
        );
    }

    const timeLeft = formatDistanceToNow(new Date(item.enddate), { addSuffix: true });
    const isEnded = new Date(item.enddate) < new Date();

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.favoriteButton}
                        onPress={toggleFavorite}
                    >
                        <Heart
                            size={24}
                            color={isFavorite ? '#F43F5E' : '#1F2937'}
                            fill={isFavorite ? '#F43F5E' : 'none'}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.imageItemousel}>
                        <Image
                            source={{ uri: `${BASE_URL}/images/uploads/${item.images[activeImageIndex]}` }}
                            style={styles.mainImage}
                            resizeMode="cover"
                        />

                        {item.images.length > 1 && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.thumbnailContainer}
                            >
                                {item.images.map((image, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => setActiveImageIndex(index)}
                                        style={[
                                            styles.thumbnailButton,
                                            activeImageIndex === index && styles.activeThumbnail,
                                        ]}
                                    >
                                        <Image
                                            source={{ uri: `${BASE_URL}/images/uploads/${image}` }}
                                            style={styles.thumbnail}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    <View style={styles.contentContainer}>
                        <View style={styles.titleRow}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.price}>₦{item.currentprice ? formatPrice(item.currentprice) : formatPrice(item.startingprice)}</Text>
                        </View>

                        {!isEnded ? (
                            <View style={styles.statusContainer}>
                                <Clock size={16} color="#6366F1" />
                                <Text style={styles.statusText}>Ends {timeLeft}</Text>
                            </View>
                        ) : (
                            <View style={[styles.statusContainer, styles.endedContainer]}>
                                <AlertTriangle size={16} color="#6B7280" />
                                <Text style={styles.endedText}>Auction ended</Text>
                            </View>
                        )}

                        <View style={styles.badgeContainer}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{item.category}</Text>
                            </View>
                            <View style={[styles.badge, styles.conditionBadge]}>
                                <Text style={styles.badgeText}>{item.condition}</Text>
                            </View>
                        </View>

                        {/* Seller information */}
                        <View style={styles.sellerContainer}>
                            <Image
                                source={images.profile}
                                style={styles.sellerAvatar}
                            />
                            <View style={styles.sellerInfo}>
                                <Text style={styles.sellerName}>
                                    {typeof item.seller === 'object' && item.seller !== null && 'name' in item.seller
                                        ? item.seller.name
                                        : 'Unknown Seller'}
                                </Text>
                                <Text style={styles.sellerCampus}>
                                    {typeof item.seller === 'object' && item.seller !== null && 'campus' in item.seller
                                        ? item.seller.campus
                                        : ''}
                                </Text>
                            </View>
                            {!owner && <TouchableOpacity
                                style={styles.contactButton}
                                onPress={handleContactSeller}
                            >
                                <MessageCircle size={16} color="#FFFFFF" />
                                <Text style={styles.contactButtonText}>Contact</Text>
                            </TouchableOpacity>}
                        </View>

                        <View style={styles.descriptionContainer}>
                            <Text style={styles.sectionTitle}>Description</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>

                        <View style={styles.bidsContainer}>
                            <Text style={styles.sectionTitle}>Bid History</Text>

                            {item.bids.length === 0 ? (
                                <View style={styles.noBidsContainer}>
                                    <Text style={styles.noBidsText}>No bids yet. Be the first to bid!</Text>
                                </View>
                            ) : (
                                item.bids.map((bid, index) => (
                                    <View key={index} style={styles.bidItem}>
                                        <View style={styles.bidUserContainer}>
                                            <User size={16} color="#6B7280" />
                                            <Text style={styles.bidUsername}>
                                                {typeof bid.bidder === 'object' && bid.bidder !== null && 'name' in bid.bidder
                                                    ? bid.bidder.name
                                                    : 'Anonymous'}
                                            </Text>
                                        </View>
                                        <View style={styles.bidDetails}>
                                            <Text style={styles.bidAmount}>₦{formatPrice(bid.amount)}</Text>
                                            <Text style={styles.bidTime}>{formatBidDate(bid.createdAt)}</Text>
                                        </View>
                                        {owner && <View style={[styles.bidDetails, { marginTop: 5, justifyContent: 'flex-end' }]}>
                                            <TouchableOpacity
                                                style={[styles.contactButton, { paddingHorizontal: 10, paddingVertical: 6 }]}
                                                onPress={() => handleContactBidder(
                                                    typeof bid.bidder === 'object' && bid.bidder !== null && '_id' in bid.bidder
                                                        ? bid.bidder._id
                                                        : ''
                                                )}
                                                disabled={
                                                    !(typeof bid.bidder === 'object' && bid.bidder !== null && '_id' in bid.bidder && bid.bidder._id)
                                                }
                                            >
                                                <MessageCircle size={16} color="#FFFFFF" />
                                                <Text style={[styles.contactButtonText, { fontSize: 12 }]}>Contact</Text>
                                            </TouchableOpacity>
                                        </View>}
                                    </View>
                                ))
                            )}
                        </View>
                    </View>

                    {(!isEnded && !owner) && (
                        <View style={styles.bidFooter}>
                            <View style={styles.bidInputContainer}>
                                <Text style={styles.dollarSign}>₦</Text>
                                <TextInput
                                    style={styles.bidInput}
                                    placeholder={`${item.currentprice ? formatPrice(item.currentprice) : formatPrice(item?.startingprice)}(min bid)`}
                                    placeholderTextColor="#9CA3AF"
                                    value={bidAmount}
                                    onChangeText={setBidAmount}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.bidButton, isSubmitting && styles.bidButtonDisabled]}
                                onPress={handlePlaceBid}
                                disabled={(isSubmitting || !bidAmount.trim() || parseFloat(bidAmount) <= (item.currentprice || item.startingprice))}
                            >
                                <Text style={styles.bidButtonText}>
                                    {isSubmitting ? 'Placing Bid...' : 'Place Bid'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                </ScrollView>


            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingHorizontal: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    favoriteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    imageItemousel: {
        width: '100%',
        height: 350,
        backgroundColor: '#F3F4F6',
    },
    mainImage: {
        width: '100%',
        height: 280,
    },
    thumbnailContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    thumbnailButton: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    activeThumbnail: {
        borderColor: '#6366F1',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    contentContainer: {
        padding: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: '#1F2937',
        flex: 1,
        marginRight: 8,
    },
    price: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: '#6366F1',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#6366F1',
        marginLeft: 4,
    },
    endedContainer: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    endedText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 4,
    },
    badgeContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    badge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    conditionBadge: {
        backgroundColor: '#F0FDFA',
    },
    badgeText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: '#4F46E5',
    },
    sellerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sellerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    sellerInfo: {
        flex: 1,
    },
    sellerName: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: '#1F2937',
        marginBottom: 2,
    },
    sellerCampus: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: '#6B7280',
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366F1',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    contactButtonText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#FFFFFF',
        marginLeft: 4,
    },
    descriptionContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: '#1F2937',
        marginBottom: 12,
    },
    description: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
    },
    bidsContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 80,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    noBidsContainer: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    noBidsText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#6B7280',
    },
    bidItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingVertical: 12,
    },
    bidUserContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    bidUsername: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: '#1F2937',
        marginLeft: 8,
    },
    bidDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 24,
    },
    bidAmount: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: '#6366F1',
    },
    bidTime: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: '#6B7280',
    },
    bidFooter: {
        marginBottom: 40,
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    bidInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginRight: 12,
        backgroundColor: '#FFFFFF',
    },
    dollarSign: {
        fontFamily: 'Inter-Medium',
        fontSize: 18,
        color: '#6B7280',
        marginRight: 4,
    },
    bidInput: {
        flex: 1,
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: '#1F2937',
        paddingVertical: 12,
    },
    bidButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        borderRadius: 12,
        justifyContent: 'center',
    },
    bidButtonDisabled: {
        opacity: 0.7,
    },
    bidButtonText: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    errorContainer: {
        backgroundColor: '#FEE2E2',
        padding: 12,
        position: 'absolute',
        bottom: 80,
        left: 16,
        right: 16,
        borderRadius: 12,
    },
    errorText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#B91C1C',
    },
});