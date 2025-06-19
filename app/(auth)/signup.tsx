import { signupSchema, type SignupFormData } from '@/lib/schemas';
import { useRegisterMutation } from '@/lib/store/api/authApi';
import { setSpinner } from '@/lib/store/slice/spinnerSlice';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, School, User } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Alert,
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


export default function SignupScreen() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const dispatch = useDispatch();
    const [register,] = useRegisterMutation();

    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            campus: '',
            phone: '',
            password: '',
            confirmpassword: '',
        }
    });

    const onSubmit = async (data: SignupFormData) => {
        let type = 'Error';
        let text = 'An error occurred. Please try again.';
        dispatch(setSpinner({ visibility: true }));
        try {
            const result = await register(data);
            const error = result.error;
            if (!error) {
                const { status, message } = result.data;
                if (status === 'SUCCESS') {
                    type = 'Success';
                    text = 'Account created successfully. Please proceed to login.';
                } else {
                    text = message || 'An error occurred. Please try again.';
                }
            } else {
                text = (error && typeof error === 'object' && 'data' in error && (error as any).data?.message)
                    ? (error as any).data.message
                    : 'An error occurred. Please try again.';
            }
        } catch (error) {
            //console.error('Authentication Error:', error)
            if (typeof error === 'object' && error !== null && 'status' in error && (error as any).status === 'FETCH_ERROR') {
                text = 'Network error, please check your network and try again'
            } else if (typeof error === 'object' && error !== null && 'data' in error) {
                text = (error as any).data?.message || 'An authentication error has occurred!'
            } else {
                text = 'An authentication error has occurred!'
            }
        } finally {
            setTimeout(() => {
                dispatch(setSpinner({ visibility: false }))
                if (type === 'Success') {
                    Alert.alert(
                        'Authentication',
                        text,
                        [
                            {
                                text: 'OK',
                                onPress: () => {
                                    router.replace('/(auth)/login');
                                },
                            },
                        ],
                        { cancelable: false }
                    )
                } else {
                    Alert.alert('Authentication', text)
                }
            }, 3000)
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                style={styles.gradient}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.container}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <ArrowLeft size={24} strokeWidth={2} stroke="#FFFFFF" />
                        </TouchableOpacity>

                        <View style={styles.headerContainer}>
                            <Text style={styles.headerText}>Create Account</Text>
                            <Text style={styles.subtitleText}>Join the campus marketplace</Text>
                        </View>

                        <View style={styles.formContainer}>

                            <Controller
                                control={control}
                                name="name"
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.inputContainer}>
                                        <View style={styles.textInputContainer}>
                                            <User size={20} strokeWidth={2} stroke="#6B7280" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Full Name"
                                                placeholderTextColor="#9CA3AF"
                                                value={value}
                                                onChangeText={onChange}
                                                autoCapitalize="words"
                                            />
                                        </View>
                                        {errors.name && (
                                            <Text style={styles.fieldError}>{errors.name.message}</Text>
                                        )}
                                    </View>
                                )}
                            />

                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.inputContainer}>
                                        <View style={styles.textInputContainer}>
                                            <Mail size={20} strokeWidth={2} stroke="#6B7280" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Email"
                                                placeholderTextColor="#9CA3AF"
                                                value={value}
                                                onChangeText={onChange}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                        </View>
                                        {errors.email && (
                                            <Text style={styles.fieldError}>{errors.email.message}</Text>
                                        )}
                                    </View>
                                )}
                            />

                            <Controller
                                control={control}
                                name="campus"
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.inputContainer}>
                                        <View style={styles.textInputContainer}>
                                            <School size={20} strokeWidth={2} stroke="#6B7280" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Campus/College"
                                                placeholderTextColor="#9CA3AF"
                                                value={value}
                                                onChangeText={onChange}
                                            />
                                        </View>
                                        {errors.campus && (
                                            <Text style={styles.fieldError}>{errors.campus.message}</Text>
                                        )}
                                    </View>
                                )}
                            />

                            <Controller
                                control={control}
                                name="phone"
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.inputContainer}>
                                        <View style={styles.textInputContainer}>
                                            <User size={20} strokeWidth={2} stroke="#6B7280" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Phone Number"
                                                placeholderTextColor="#9CA3AF"
                                                value={value}
                                                onChangeText={onChange}
                                                keyboardType="phone-pad"
                                            />
                                        </View>
                                        {errors.phone && (
                                            <Text style={styles.fieldError}>{errors.phone.message}</Text>
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
                                            <Lock size={20} strokeWidth={2} stroke="#6B7280" style={styles.inputIcon} />
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
                                            <Text style={styles.fieldError}>{errors.password.message}</Text>
                                        )}
                                    </View>
                                )}
                            />

                            <Controller
                                control={control}
                                name="confirmpassword"
                                render={({ field: { onChange, value } }) => (
                                    <View style={styles.inputContainer}>
                                        <View style={styles.textInputContainer}>
                                            <Lock size={20} strokeWidth={2} stroke="#6B7280" style={styles.inputIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Confirm Password"
                                                placeholderTextColor="#9CA3AF"
                                                value={value}
                                                onChangeText={onChange}
                                                secureTextEntry={!showConfirmPassword}
                                            />
                                            <TouchableOpacity
                                                style={styles.eyeIcon}
                                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff size={20} strokeWidth={2} stroke="#6B7280" />
                                                ) : (
                                                    <Eye size={20} strokeWidth={2} stroke="#6B7280" />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                        {errors.confirmpassword && (
                                            <Text style={styles.fieldError}>{errors.confirmpassword.message}</Text>
                                        )}
                                    </View>
                                )}
                            />

                            <TouchableOpacity
                                style={[styles.signupButton, isSubmitting && styles.signupButtonDisabled]}
                                onPress={handleSubmit(onSubmit)}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.signupButtonText}>
                                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.loginContainer}>
                                <Text style={styles.loginText}>Already have an account? </Text>
                                <Link href="/login" asChild>
                                    <TouchableOpacity>
                                        <Text style={styles.loginLink}>Sign in</Text>
                                    </TouchableOpacity>
                                </Link>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        padding: 24,
    },
    backButton: {
        marginTop: 48,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        marginTop: 24,
        marginBottom: 32,
    },
    headerText: {
        fontFamily: 'Inter-Bold',
        fontSize: 28,
        color: '#FFFFFF',
    },
    subtitleText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 8,
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    errorContainer: {
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#B91C1C',
    },
    inputContainer: {
        marginBottom: 16,
    },
    textInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#1F2937',
    },
    eyeIcon: {
        padding: 4,
    },
    fieldError: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: '#B91C1C',
        marginTop: 4,
        marginLeft: 12,
    },
    signupButton: {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    signupButtonDisabled: {
        opacity: 0.7,
    },
    signupButtonText: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: '#6B7280',
    },
    loginLink: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#6366F1',
    },
});
