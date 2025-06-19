
import { images } from '@/constants';
import { RootState } from '@/lib/store';
import { useAddMessageMutation, useAddNewConversationMutation, useGetConversationsQuery } from '@/lib/store/api/conversationsApi';
import { useGetItemsQuery } from '@/lib/store/api/itemsApi';
import { Conversation, Item, Message, User } from '@/types/auction';
import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

export default function ConversationScreen() {
    const { id } = useLocalSearchParams(); // id is the other user id
    const {
        data: items = [],
    } = useGetItemsQuery();
    const user = useSelector((state: RootState) => state.auth.user); // current user from Redux store
    const { data, isLoading } = useGetConversationsQuery(
        undefined,
        {
            pollingInterval: 10000,
            refetchOnFocus: true,
            refetchOnReconnect: true,
        }
    );
    // mutations
    const [addNewConversation] = useAddNewConversationMutation();
    const [addMessage] = useAddMessageMutation();

    const conversation = data?.entities
        ? (Object.values(data.entities) as Conversation[]).find((conv) => {
            const participantIds = conv.participants.map((p: any) =>
                typeof p === 'object' ? p._id : p
            );
            return (
                participantIds.includes(user?._id as string) &&
                participantIds.includes(id as string)
            );
        })
        : undefined;

    const [otherUser, setOtherUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [messageText, setMessageText] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    let resolvedItems: Item[] = [];

    if (Array.isArray(items)) {
        resolvedItems = items;
    } else if ('ids' in items && 'entities' in items) {
        resolvedItems = (items.ids as string[])
            .map(id => items.entities[id]!)
            .filter(Boolean);
    }

    const seller = resolvedItems.find(
        (item) =>
            typeof item.seller === 'object' &&
            item.seller !== null &&
            '_id' in item.seller &&
            item.seller._id === id
    );

    useEffect(() => {
        if (conversation && user?._id) {
            const otherParticipant = conversation.participants.find(
                (p) =>
                    typeof p === 'object' &&
                    p !== null &&
                    '_id' in p &&
                    (p._id === id)
            ) as User | undefined;
            setOtherUser(otherParticipant || null);
            setMessages(conversation.messages);
            setLoading(false);
        } else {
            setOtherUser(seller?.seller && typeof seller.seller === 'object' ? seller.seller : null);
            setMessages([]);
            setLoading(false);
        }
    }, [conversation, id, user]);

    useEffect(() => {
        // Scroll to bottom when new message arrives
        if (flatListRef.current && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleSendMessage = async () => {
        let type = 'Error';
        let text = 'Failed to send message';
        if (!messageText.trim()) return;
        setSending(true);

        try {
            let convId = conversation?._id as string | undefined;
            let newConv = false;
            if (!convId) {
                // Create a new conversation if it doesn't exist
                const result: any = await addNewConversation({ participants: [String(user?._id), String(id)] });
                if (!result.error && result.data?.status === 'SUCCESS') {
                    convId = result.data.data._id;
                    newConv = true;
                    type = 'Success';
                    text = 'Conversation started successfully';
                } else {
                    throw new Error(result.error?.message || result.data?.message || 'Failed to start conversation');
                }
            }
            if (!convId) throw new Error('No conversation ID found');

            // Create a new message
            const response = await addMessage({
                convId,
                receiver: Array.isArray(id) ? id[0] : id,
                sender: user?._id || user?.id || '',
                content: messageText.trim(),
            });
            if (response.error) {
                const errorMessage =
                    (typeof response.error === 'object' &&
                        response.error !== null &&
                        'data' in response.error &&
                        typeof (response.error as any).data?.message === 'string')
                        ? (response.error as any).data.message
                        : 'Failed to send message';
                throw new Error(errorMessage);
            }

            const newMessageData = response.data.data;

            setMessages((prev) => [
                ...prev,
                ...(Array.isArray(newMessageData) ? newMessageData : [newMessageData])
            ]);
            setMessageText('');
            if (newConv) {
                setMessageText('');
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
            Alert.alert('Error', error.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return format(date, 'h:mm a');
    };

    const renderMessageItem = ({ item }: { item: Message }) => {
        const senderId = item.sender;
        const isSentByMe = senderId === user?._id;
        return (
            <View style={[styles.messageContainer, isSentByMe ? styles.sentMessage : styles.receivedMessage]}>
                <View style={[styles.messageBubble, isSentByMe ? styles.sentBubble : styles.receivedBubble]}>
                    <Text style={[styles.messageText, isSentByMe ? styles.sentMessageText : styles.receivedMessageText]}>
                        {item.content}
                    </Text>
                </View>
                <Text style={[styles.messageTime, isSentByMe ? styles.sentMessageTime : styles.receivedMessageTime]}>
                    {formatMessageTime(item.createdAt)}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>

                {otherUser && (
                    <View style={styles.profileContainer}>
                        <Image
                            source={images.profile || { uri: otherUser.avatar || 'https://via.placeholder.com/40' }}
                            style={styles.avatar}
                        />
                        <View>
                            <Text style={styles.userName}>{otherUser.name}</Text>
                            <Text style={styles.userStatus}>Usually responds in minutes</Text>
                        </View>
                    </View>
                )}
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={{ flex: 1 }}>
                    {(loading && isLoading) ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading conversation...</Text>
                        </View>
                    ) : (loading && !isLoading) ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Start conversation...</Text>
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessageItem}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.messagesList}
                            inverted={false}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            keyboardShouldPersistTaps="handled"
                        />
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#9CA3AF"
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        onFocus={() => {
                            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
                        }}
                        blurOnSubmit={false}
                        returnKeyType="send"
                        onSubmitEditing={handleSendMessage}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
                        onPress={handleSendMessage}
                        disabled={!messageText.trim() || sending}
                    >
                        <Send size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    userName: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: '#1F2937',
    },
    userStatus: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    keyboardAvoidingView: {
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
    },
    messagesList: {
        padding: 16,
    },
    messageContainer: {
        marginBottom: 16,
        maxWidth: '80%',
    },
    sentMessage: {
        alignSelf: 'flex-end',
    },
    receivedMessage: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    sentBubble: {
        backgroundColor: '#6366F1',
        borderTopRightRadius: 4,
    },
    receivedBubble: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 24,
    },
    sentMessageText: {
        fontFamily: 'Inter-Regular',
        color: '#FFFFFF',
    },
    receivedMessageText: {
        fontFamily: 'Inter-Regular',
        color: '#1F2937',
    },
    messageTime: {
        fontSize: 12,
        marginTop: 4,
    },
    sentMessageTime: {
        fontFamily: 'Inter-Regular',
        color: '#A5B4FC',
        textAlign: 'right',
    },
    receivedMessageTime: {
        fontFamily: 'Inter-Regular',
        color: '#9CA3AF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingRight: 48,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#1F2937',
        maxHeight: 120,
    },
    sendButton: {
        position: 'absolute',
        right: 24,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#A5B4FC',
    },
});