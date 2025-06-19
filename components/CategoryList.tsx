import { Bike, Book, Camera, Laptop, Shirt, Sofa, Ticket, Volleyball } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Category {
    id: string;
    name: string;
    icon: React.ReactNode;
}

interface CategoryListProps {
    selectedCategory: string | null;
    onSelectCategory: (categoryId: string | null) => void;
}

export default function CategoryList({ selectedCategory, onSelectCategory }: CategoryListProps) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {categories.map((category) => (
                <TouchableOpacity
                    key={category.id}
                    style={[
                        styles.categoryButton,
                        selectedCategory === category.id && styles.selectedCategory,
                    ]}
                    onPress={() => onSelectCategory(category.id === 'all' ? null : category.id)}
                >
                    {category.icon}
                    <Text
                        style={[
                            styles.categoryText,
                            selectedCategory === category.id && styles.selectedCategoryText,
                        ]}
                    >
                        {category.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 60,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    selectedCategory: {
        backgroundColor: '#6366F1',
    },
    iconPlaceholder: {
        width: 20,
        height: 20,
    },
    categoryText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#4B5563',
        marginLeft: 6,
    },
    selectedCategoryText: {
        color: '#FFFFFF',
    },
});

const categories: Category[] = [
    {
        id: 'all',
        name: 'All',
        icon: <View style={styles.iconPlaceholder} />,
    },
    {
        id: 'electronics',
        name: 'Electronics',
        icon: <Laptop size={20} color="#6366F1" />,
    },
    {
        id: 'books',
        name: 'Books',
        icon: <Book size={20} color="#8B5CF6" />,
    },
    {
        id: 'furniture',
        name: 'Furniture',
        icon: <Sofa size={20} color="#EC4899" />,
    },
    {
        id: 'clothing',
        name: 'Clothing',
        icon: <Shirt size={20} color="#F59E0B" />,
    },
    {
        id: 'bikes',
        name: 'Bikes',
        icon: <Bike size={20} color="#10B981" />,
    },
    {
        id: 'sports',
        name: 'Sports',
        icon: <Volleyball size={20} color="#EF4444" />,
    },
    {
        id: 'photography',
        name: 'Photography',
        icon: <Camera size={20} color="#3B82F6" />,
    },
    {
        id: 'tickets',
        name: 'Tickets',
        icon: <Ticket size={20} color="#F43F5E" />,
    },
];