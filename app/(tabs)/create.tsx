import DatePicker from '@/components/DatePicker';
import { createListingSchema, type CreateListingFormData } from '@/lib/schemas';
import { RootState } from '@/lib/store';
import { useAddNewItemMutation } from '@/lib/store/api/itemsApi';
import { setSpinner } from '@/lib/store/slice/spinnerSlice';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ArrowLeft, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

type Condition = 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';

export default function CreateListingScreen() {
    const dispatch = useDispatch();
    const [addNewItem, { isLoading, error: createError }] = useAddNewItemMutation();
    const user = useSelector((state: RootState) => state.auth.user);
    const [error, setError] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors, isSubmitting, }, setValue, watch } = useForm<CreateListingFormData>({
        resolver: zodResolver(createListingSchema),
        defaultValues: {
            title: '',
            description: '',
            category: '',
            condition: 'New',
            startingprice: '0',
            enddate: '',
            startdate: '',
            images: [],
        }
    });

    const images = watch('images');

    const categories = [
        'Electronics',
        'Books',
        'Furniture',
        'Clothing',
        'Bikes',
        'Sports',
        'Photography',
        'Tickets',
        'Other',
    ];

    const conditions: Condition[] = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setValue('images', [...images, result.assets[0].uri]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setValue('images', newImages);
    };

    const onSubmit = async (data: CreateListingFormData) => {
        let type = 'Error';
        let text = 'An error occurred while creating the listing. Please try again.';
        dispatch(setSpinner({ visibility: true }));
        try {
            const payload = {
                ...data,
                startingprice: Number(data.startingprice),
                seller: user?._id,
                images: data.images,
            };
            const result = await addNewItem(payload);
            const error = result.error;
            if (!error) {
                const { status, message } = result.data;
                if (status === 'SUCCESS') {
                    type = 'Success';
                    text = 'Listing created successfully.';
                } else {
                    text = message || 'An error occurred while creating the listing. Please try again.';
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
                    text = (error as any).data.message || 'An error occurred while creating the listing. Please try again.';
                } else {
                    text = 'An error occurred while creating the listing. Please try again.';
                }
            }
        } catch (err) {
            console.error('Error creating listing:', err);
            text = 'An error occurred while creating the listing. Please try again.';
        } finally {
            setTimeout(() => {
                dispatch(setSpinner({ visibility: false }))
                if (type === 'Success') {
                    Alert.alert(
                        'Create Listing',
                        text,
                        [
                            {
                                text: 'OK',
                                onPress: () => {
                                    router.replace('/');

                                },
                            },
                        ],
                        { cancelable: false }
                    )
                } else {
                    Alert.alert('Create Listing', text)
                }
            }, 3000)
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={24} strokeWidth={2} stroke="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create Listing</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.form}>
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <Controller
                            control={control}
                            name="title"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Title</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="What are you selling?"
                                            placeholderTextColor="#9CA3AF"
                                            value={value?.toString() ?? ''}
                                            onChangeText={onChange}
                                        />
                                        {errors.title && (
                                            <Text style={styles.fieldError}>{errors.title.message}</Text>
                                        )}
                                    </View>
                                </View>
                            )}
                        />

                        <Controller
                            control={control}
                            name="description"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Description</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            placeholder="Describe your item (condition, features, etc.)"
                                            placeholderTextColor="#9CA3AF"
                                            value={value?.toString() ?? ''}
                                            onChangeText={onChange}
                                            multiline
                                            numberOfLines={5}
                                            textAlignVertical="top"
                                        />
                                        {errors.description && (
                                            <Text style={styles.fieldError}>{errors.description.message}</Text>
                                        )}
                                    </View>
                                </View>
                            )}
                        />
                        <Controller
                            control={control}
                            name="campus"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Campus</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter campus name"
                                            placeholderTextColor="#9CA3AF"
                                            value={value?.toString() ?? ''}
                                            onChangeText={onChange}
                                        />
                                        {errors.campus && (
                                            <Text style={styles.fieldError}>{errors.campus.message}</Text>
                                        )}
                                    </View>
                                </View>
                            )}
                        />

                        <Controller
                            control={control}
                            name="category"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Category</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.categoryContainer}
                                    >
                                        {categories.map((category) => (
                                            <TouchableOpacity
                                                key={category}
                                                style={[
                                                    styles.categoryButton,
                                                    value === category && styles.categoryButtonSelected,
                                                ]}
                                                onPress={() => onChange(category)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.categoryButtonText,
                                                        value === category && styles.categoryButtonTextSelected,
                                                    ]}
                                                >
                                                    {category}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                    {errors.category && (
                                        <Text style={styles.fieldError}>{errors.category.message}</Text>
                                    )}
                                </View>
                            )}
                        />

                        <Controller
                            control={control}
                            name="condition"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Condition</Text>
                                    <View style={styles.conditionContainer}>
                                        {conditions.map((condition) => (
                                            <TouchableOpacity
                                                key={condition}
                                                style={[
                                                    styles.conditionButton,
                                                    value === condition && styles.conditionButtonSelected,
                                                ]}
                                                onPress={() => onChange(condition)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.conditionButtonText,
                                                        value === condition && styles.conditionButtonTextSelected,
                                                    ]}
                                                >
                                                    {condition}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {errors.condition && (
                                        <Text style={styles.fieldError}>{errors.condition.message}</Text>
                                    )}
                                </View>
                            )}
                        />

                        <Controller
                            control={control}
                            name="startingprice"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Starting Price</Text>
                                    <View style={styles.inputWrapper}>
                                        <View style={styles.priceInputContainer}>
                                            <Text style={styles.currencySymbol}>₦</Text>
                                            <TextInput
                                                style={styles.priceInput}
                                                placeholder="0.00"
                                                placeholderTextColor="#9CA3AF"
                                                value={value?.toString() ?? '0'}
                                                onChangeText={onChange}
                                                keyboardType="decimal-pad"
                                            />
                                        </View>
                                        {errors.startingprice && (
                                            <Text style={styles.fieldError}>{errors.startingprice.message}</Text>
                                        )}
                                    </View>
                                </View>
                            )}
                        />

                        <DatePicker
                            control={control}
                            name="startdate"
                            label="Start Date"
                            errors={errors}
                            styles={styles}
                        />

                        <DatePicker
                            control={control}
                            name="enddate"
                            label="End Date"
                            errors={errors}
                            styles={styles}
                        />

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Photos</Text>
                            <Text style={styles.photoSubtitle}>Add up to 5 photos of your item</Text>

                            <View style={styles.imageGrid}>
                                {images.map((image, index) => (
                                    <View key={index} style={styles.imageContainer}>
                                        <Image source={{ uri: image }} style={styles.image} />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => removeImage(index)}
                                        >
                                            <X size={16} strokeWidth={2} stroke="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                {images.length < 5 && (
                                    <TouchableOpacity
                                        style={styles.addImageButton}
                                        onPress={pickImage}
                                    >
                                        <Plus size={24} strokeWidth={2} stroke="#6366F1" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {errors.images && (
                                <Text style={styles.fieldError}>{errors.images.message}</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
                            onPress={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.createButtonText}>
                                {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
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
    scrollContent: {
        paddingBottom: 40,
    },
    form: {
        padding: 16,
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
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: '#1F2937',
        marginBottom: 8,
    },
    inputWrapper: {
        flex: 1,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#1F2937',
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    fieldError: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: '#B91C1C',
        marginTop: 4,
        marginLeft: 12,
    },
    categoryContainer: {
        paddingVertical: 8,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        marginRight: 8,
    },
    categoryButtonSelected: {
        borderColor: '#6366F1',
        backgroundColor: '#EEF2FF',
    },
    categoryButtonText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#4B5563',
    },
    categoryButtonTextSelected: {
        color: '#6366F1',
    },
    conditionContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    conditionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        marginRight: 8,
        marginBottom: 8,
    },
    conditionButtonSelected: {
        borderColor: '#6366F1',
        backgroundColor: '#EEF2FF',
    },
    conditionButtonText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#4B5563',
    },
    conditionButtonTextSelected: {
        color: '#6366F1',
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    currencySymbol: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: '#4B5563',
        marginRight: 4,
    },
    priceInput: {
        flex: 1,
        paddingVertical: 12,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#1F2937',
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    dateIcon: {
        marginRight: 8,
    },
    dateInput: {
        flex: 1,
        paddingVertical: 12,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: '#1F2937',
    },
    photoSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 8,
        marginBottom: 8,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addImageButton: {
        width: 100,
        height: 100,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        marginRight: 8,
        marginBottom: 8,
    },
    createButton: {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    createButtonDisabled: {
        opacity: 0.7,
    },
    createButtonText: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
});