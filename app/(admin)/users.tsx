import { images } from '@/constants';
import { RootState } from '@/lib/store';
import { useGetUsersQuery, useUpdateUserStatusMutation } from '@/lib/store/api/adminApi';
import { User } from '@/types/auction';
import { router } from 'expo-router';
import { ArrowLeft, Ban, CircleCheck as CheckCircle, Search, Shield, User as UserIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';

interface UserItemProps {
    user: User;
    onStatusChange: (userId: string, status: 'active' | 'suspended') => void;
    onMakeAdmin: (userId: string) => void;
}

function UserItem({ user, onStatusChange, onMakeAdmin }: UserItemProps) {
    const isActive = !user.roles.includes('Suspended');
    const isAdmin = user.roles.includes('Admin') || user.roles.includes('SuperAdmin');

    return (
        <View style={styles.userCard}>
            <View style={styles.userInfo}>
                <Image
                    source={user.avatar ? { uri: user.avatar } : images.profile}
                    style={styles.avatar}
                />
                <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userCampus}>{user.campus}</Text>
                    <View style={styles.roleContainer}>
                        {user.roles.map((role, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.roleBadge,
                                    role === 'Admin' || role === 'SuperAdmin'
                                        ? styles.adminBadge
                                        : role === 'Suspended'
                                        ? styles.suspendedBadge
                                        : styles.studentBadge
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.roleText,
                                        role === 'Admin' || role === 'SuperAdmin'
                                            ? styles.adminText
                                            : role === 'Suspended'
                                            ? styles.suspendedText
                                            : styles.studentText
                                    ]}
                                >
                                    {role}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
            
            <View style={styles.actionButtons}>
                {!isAdmin && (
                    <>
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                isActive ? styles.suspendButton : styles.activateButton
                            ]}
                            onPress={() => onStatusChange(user._id, isActive ? 'suspended' : 'active')}
                        >
                            {isActive ? (
                                <Ban size={16} color="#FFFFFF" />
                            ) : (
                                <CheckCircle size={16} color="#FFFFFF" />
                            )}
                            <Text style={styles.actionButtonText}>
                                {isActive ? 'Suspend' : 'Activate'}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={styles.adminButton}
                            onPress={() => onMakeAdmin(user._id)}
                        >
                            <Shield size={16} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Make Admin</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

export default function AdminUsersScreen() {
    const admin = useSelector((state: RootState) => state.admin.admin);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'students' | 'admins' | 'suspended'>('all');
    
    const { data: usersRaw = [], isLoading, refetch } = useGetUsersQuery();
    const [updateUserStatus] = useUpdateUserStatusMutation();

    // Normalize users
    const users = useMemo<User[]>(() => {
        if (Array.isArray(usersRaw)) return usersRaw;
        if ('data' in usersRaw && Array.isArray(usersRaw.data)) return usersRaw.data;
        return [];
    }, [usersRaw]);

    // Filter and search users
    const filteredUsers = useMemo(() => {
        let filtered = users;

        // Apply role filter
        if (selectedFilter !== 'all') {
            filtered = filtered.filter(user => {
                switch (selectedFilter) {
                    case 'students':
                        return user.roles.includes('Student') && !user.roles.includes('Admin');
                    case 'admins':
                        return user.roles.includes('Admin') || user.roles.includes('SuperAdmin');
                    case 'suspended':
                        return user.roles.includes('Suspended');
                    default:
                        return true;
                }
            });
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.campus.toLowerCase().includes(query)
            );
        }

        return filtered.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [users, selectedFilter, searchQuery]);

    const handleStatusChange = async (userId: string, status: 'active' | 'suspended') => {
        const action = status === 'suspended' ? 'suspend' : 'activate';
        Alert.alert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
            `Are you sure you want to ${action} this user?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: action.charAt(0).toUpperCase() + action.slice(1),
                    style: status === 'suspended' ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            await updateUserStatus({ userId, status }).unwrap();
                            Alert.alert('Success', `User ${action}d successfully`);
                            refetch();
                        } catch (error) {
                            Alert.alert('Error', `Failed to ${action} user. Please try again.`);
                        }
                    },
                },
            ]
        );
    };

    const handleMakeAdmin = async (userId: string) => {
        Alert.alert(
            'Grant Admin Access',
            'Are you sure you want to grant admin privileges to this user?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Grant Access',
                    onPress: async () => {
                        try {
                            await updateUserStatus({ userId, status: 'admin' }).unwrap();
                            Alert.alert('Success', 'Admin privileges granted successfully');
                            refetch();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to grant admin privileges. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const filterOptions = [
        { key: 'all', label: 'All Users', count: users.length },
        { key: 'students', label: 'Students', count: users.filter(u => u.roles.includes('Student') && !u.roles.includes('Admin')).length },
        { key: 'admins', label: 'Admins', count: users.filter(u => u.roles.includes('Admin') || u.roles.includes('SuperAdmin')).length },
        { key: 'suspended', label: 'Suspended', count: users.filter(u => u.roles.includes('Suspended')).length },
    ];

    const renderItem = ({ item }: { item: User }) => (
        <UserItem
            user={item}
            onStatusChange={handleStatusChange}
            onMakeAdmin={handleMakeAdmin}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Management</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#6B7280" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users by name, email, or campus..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={styles.filtersContainer}>
                {filterOptions.map((option) => (
                    <TouchableOpacity
                        key={option.key}
                        style={[
                            styles.filterButton,
                            selectedFilter === option.key && styles.activeFilterButton,
                        ]}
                        onPress={() => setSelectedFilter(option.key as any)}
                    >
                        <Text
                            style={[
                                styles.filterButtonText,
                                selectedFilter === option.key && styles.activeFilterButtonText,
                            ]}
                        >
                            {option.label} ({option.count})
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading users...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <UserIcon size={64} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>No users found</Text>
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'Try adjusting your search terms' : 'No users match the selected filter'}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    },
    headerTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: '#1F2937',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#1F2937',
        marginLeft: 8,
        paddingVertical: 8,
    },
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
    },
    activeFilterButton: {
        backgroundColor: '#DC2626',
    },
    filterButtonText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#6B7280',
    },
    activeFilterButtonText: {
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
    },
    listContent: {
        paddingTop: 16,
        paddingBottom: 24,
    },
    userCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    userInfo: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: '#1F2937',
        marginBottom: 2,
    },
    userEmail: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 2,
    },
    userCampus: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    roleContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 4,
    },
    studentBadge: {
        backgroundColor: '#EEF2FF',
    },
    adminBadge: {
        backgroundColor: '#FEF3C7',
    },
    suspendedBadge: {
        backgroundColor: '#FEE2E2',
    },
    roleText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
    },
    studentText: {
        color: '#4F46E5',
    },
    adminText: {
        color: '#D97706',
    },
    suspendedText: {
        color: '#DC2626',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 8,
    },
    suspendButton: {
        backgroundColor: '#DC2626',
    },
    activateButton: {
        backgroundColor: '#10B981',
    },
    adminButton: {
        backgroundColor: '#F59E0B',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 8,
    },
    actionButtonText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: '#FFFFFF',
        marginLeft: 4,
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
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
});