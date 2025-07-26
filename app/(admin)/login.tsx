import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Eye, EyeOff, Lock, Shield, User } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { z } from 'zod';

import { images } from '@/constants';
import { useAdminLoginMutation } from '@/lib/store/api/adminApi';
import { setAdminCredentials } from '@/lib/store/slice/adminSlice';
import { setSpinner } from '@/lib/store/slice/spinnerSlice';

const adminLoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    adminCode: z.string().min(4, 'Admin code is required'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export default function AdminLoginScreen() {
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();
    const [adminLogin] = useAdminLoginMutation();

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<AdminLoginFormData>({
        resolver: zodResolver(adminLoginSchema),
        defaultValues: {
            email: '',
            password: '',
            adminCode: ''
        }
    });

    const onSubmit = async (data: AdminLoginFormData) => {
        let type = 'Error';
        let text = 'Admin login failed. Please check your credentials.';
        dispatch(setSpinner({ visibility: true }));
        
        try {
            const result = await adminLogin(data).unwrap();
            const { status, user, accessToken } = result;
            
            if (status === 'SUCCESS') {
                // Verify admin role
                if (user.roles.includes('Admin') || user.roles.includes('SuperAdmin')) {
                    dispatch(setAdminCredentials({ token: accessToken, admin: user }));
                    type = 'Success';
                    text = 'Welcome to Admin Dashboard!';
                } else {
                    text = 'Access denied. Admin privileges required.';
                }
            } else {
                text = 'Invalid admin credentials. Please try again.';
            }
        } catch (error) {
            const err = error as { status?: string; data?: { message?: string } };
            if (err?.status === 'FETCH_ERROR') {
                text = 'Network error, please check your connection and try again';
            } else {
                text = err.data?.message || 'Admin authentication failed!';
            }
        } finally {
            setTimeout(() => {
                dispatch(setSpinner({ visibility: false }));
                if (type === 'Success') {
                    Alert.alert(
                        'Admin Access',
                        text,
                        [
                            {
                                text: 'OK',
                                onPress: () => {
                                    router.replace('/(admin)/dashboard');
                                },
                            },
                        ],
                        { cancelable: false }
                    );
                } else {
                    Alert.alert('Admin Access', text);
                }
            }, 1000);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={['#DC2626', '#B91C1C']}
                style={styles.gradient}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.container}>
                        <View style={styles.logoContainer}>
                            <View style={styles.adminIconContainer}>
                                <Shield size={60} color="#FFFFFF" />
                            </View>
                            <Text style={styles.logoText}>Admin Portal</Text>
                            <Text style={styles.tagline}>
                                Secure Administrative Access
                            </Text>
                            <Text style={styles.tagline}>
                                Students Auction System
                            </Text>
                        </View>

                        <View style={styles.formContainer}>
                            <Text style={styles.welcomeText}>Admin Login</Text>
                            <Text style={styles.subtitleText}>
                                Enter your administrative credentials
                            </Text>

                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.inputContainer}>
                                        <View style={styles.textInputContainer}>
                                            <User
                                                size={20}
                                                strokeWidth={2}
                                                stroke="#6B7280"
                                                style={styles.inputIcon}
                                            />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Admin Email"
                                                placeholderTextColor="#9CA3AF"
                                                value={value}
                                                onChangeText={onChange}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                        </View>
                                        {errors.email && (
                                            <Text style={styles.fieldError}>
                                                {errors.email.message}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            />

                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.inputContainer}>
                                        <View style={styles.textInputContainer}>
                                            <Lock
                                                size={20}
                                                strokeWidth={2}
                                                stroke="#6B7280"
                                                style={styles.inputIcon}
                                            />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Password"
                                                placeholderTextColor="#9CA3AF"
                                                value={value}
                                                onChangeText={onChange}
                                                secureTextEntry={!showPassword}
                                            />
                                            <TouchableOpacity
                                                style={styles.eyeIcon}
                                                onPress={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={20} strokeWidth={2} stroke="#6B7280" />
                                                ) : (
                                                    <Eye size={20} strokeWidth={2} stroke="#6B7280" />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                        {errors.password && (
                                            <Text style={styles.fieldError}>
                                                {errors.password.message}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            />

                            <Controller
                                control={control}
                                name="adminCode"
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.inputContainer}>
                                        <View style={styles.textInputContainer}>
                                            <Shield
                                                size={20}
                                                strokeWidth={2}
                                                stroke="#6B7280"
                                                style={styles.inputIcon}
                                            />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Admin Access Code"
                                                placeholderTextColor="#9CA3AF"
                                                value={value}
                                                onChangeText={onChange}
                                                secureTextEntry
                                            />
                                        </View>
                                        {errors.adminCode && (
                                            <Text style={styles.fieldError}>
                                                {errors.adminCode.message}
                                            </Text>
                                        )}
                                    </View>
                                )}
                            />

                            <TouchableOpacity
                                style={[
                                    styles.loginButton,
                                    isSubmitting && styles.loginButtonDisabled
                                ]}
                                onPress={handleSubmit(onSubmit)}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.loginButtonText}>
                                    {isSubmitting ? 'Authenticating...' : 'Access Admin Panel'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.back()}
                            >
                                <Text style={styles.backButtonText}>Back to Student Portal</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1
    },
    scrollContainer: {
        flexGrow: 1
    },
    container: {
        flex: 1,
        padding: 24
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 40,
    },
    adminIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoText: {
        fontFamily: 'Inter-Bold',
        fontSize: 28,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    tagline: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginTop: 4,
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5
    },
    welcomeText: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitleText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 24,
        textAlign: 'center'
    },
    inputContainer: {
        marginBottom: 16
    },
    textInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    inputIcon: {
        marginRight: 8
    },
    input: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#1F2937'
    },
    eyeIcon: {
        padding: 4
    },
    fieldError: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: '#B91C1C',
        marginTop: 4,
        marginLeft: 12
    },
    loginButton: {
        backgroundColor: '#DC2626',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 16
    },
    loginButtonDisabled: {
        opacity: 0.7
    },
    loginButtonText: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: '#FFFFFF'
    },
    backButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    backButtonText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#6B7280',
    },
});