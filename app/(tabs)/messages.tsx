import { images } from '@/constants';
import { RootState } from '@/lib/store';
import { useGetConversationsQuery, useUpdateMessageMutation } from '@/lib/store/api/conversationsApi';
import { Message, User } from '@/types/auction';
import { router } from 'expo-router';
import { MessageCircle, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

interface ConversationProps {
    id: string;
    user: User;
    lastMessage: Message;
    unreadCount: number;
}



interface ConversationProps {
    id: string;
    user: User;
    lastMessage: Message;
    unreadCount: number;
}

export default function MessagesScreen() {
    const { data, isLoading } = useGetConversationsQuery(
        undefined,
        {
            pollingInterval: 10000,
            refetchOnFocus: true,
            refetchOnReconnect: true,
        }
    );
    const [updateMessage] = useUpdateMessageMutation();
    const user = useSelector((state: RootState) => state.auth.user);
    const [searchQuery, setSearchQuery] = useState('');

    // Transform API data to ConversationProps[]
    const conversations: ConversationProps[] = useMemo(() => {
        if (!data?.entities || !user?._id) return [];
        return Object.values(data.entities)
            .filter((conv: any) =>
                Array.isArray(conv.participants) &&
                conv.participants.some((p: any) => (typeof p === 'object' ? p._id : p) === user._id)
            )
            .map((conv: any) => {
                // Find the other participant
                const otherParticipantRaw = conv.participants.find((p: any) => {
                    const participantId = typeof p === 'object' ? p._id : p;
                    return participantId !== user._id;
                });
                const otherUser: User =
                    typeof otherParticipantRaw === 'object'
                        ? (otherParticipantRaw as User)
                        : {
                            _id: otherParticipantRaw as string,
                            id: otherParticipantRaw as string,
                            email: '',
                            name: '',
                            avatar: '',
                            campus: '',
                            createdAt: '',
                            roles: [],
                            phone: '',
                        };
                // Get last message
                const lastMessage: Message =
                    Array.isArray(conv.messages) && conv.messages.length > 0
                        ? conv.messages[conv.messages.length - 1]
                        : ({
                            _id: '',
                            content: '',
                            createdAt: '',
                            read: false,
                            sender: '',
                            receiver: '',
                        } as Message);
                // Unread count
                const unreadCount =
                    Array.isArray(conv.messages) && user._id
                        ? conv.messages.filter(
                            (msg: any) => msg.receiver === user._id && msg.read === false
                        ).length
                        : 0;
                return {
                    id: conv._id || conv.id,
                    user: otherUser,
                    lastMessage,
                    unreadCount,
                };
            })
            .sort((a, b) =>
                b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt)
            );
    }, [data, user]);

    // Filtered conversations by search
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        return conversations.filter((conv) =>
            conv.user.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [conversations, searchQuery]);

    const formatMessageTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleUpdateMessage = async (convid: string, userid: string) => {
        try {
            await updateMessage({ convid, userid }).unwrap();
        } catch (error) {
            console.error('Failed to update message:', error);
        }
    };

    const handleConversationPress = (userid: string, conversationId: string) => {
        router.push({ pathname: '/conversation/[id]', params: { id: userid } });
        // Mark messages as read when conversation is opened
        handleUpdateMessage(conversationId, user?._id || '');
    };

    const renderItem = ({ item }: { item: ConversationProps }) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => handleConversationPress(item.user._id, item.id)}
            activeOpacity={0.7}
        >
            <Image
                source={item.user.avatar ? { uri: item.user.avatar } : images.profile}
                style={styles.avatar}
            />
            <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                    <Text style={styles.userName}>{item.user.name || 'Unknown User'}</Text>
                    <Text style={styles.messageTime}>
                        {formatMessageTime(item.lastMessage.createdAt)}
                    </Text>
                </View>
                <View style={styles.messageRow}>
                    <Text
                        style={[
                            styles.messagePreview,
                            !item.lastMessage.read &&
                            item.lastMessage.sender !== user?._id &&
                            styles.unreadMessage,
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {item.lastMessage.content}
                    </Text>
                    {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Messages</Text>
                <View style={styles.searchContainer}>
                    <Search size={20} strokeWidth={2} stroke="#6B7280" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search conversations"
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading conversations...</Text>
                </View>
            ) : filteredConversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MessageCircle size={64} strokeWidth={2} stroke="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No conversations yet</Text>
                    <Text style={styles.emptyText}>
                        Messages from your auctions will appear here
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredConversations}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
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
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#1F2937',
        paddingVertical: 12,
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    listContent: {
        paddingTop: 8,
    },
    conversationItem: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 12,
    },
    conversationContent: {
        flex: 1,
        justifyContent: 'center',
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: '#1F2937',
    },
    messageTime: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: '#6B7280',
    },
    messageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messagePreview: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: '#6B7280',
    },
    unreadMessage: {
        fontFamily: 'Inter-Medium',
        color: '#1F2937',
    },
    unreadBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    unreadCount: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: '#FFFFFF',
    },
});


