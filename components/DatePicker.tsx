import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import React, { useState } from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Platform, StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface DatePickerProps {
    control: Control<any>;
    name: string;
    label: string;
    errors: FieldErrors;
    styles: {
        formGroup: StyleProp<ViewStyle>;
        label: StyleProp<TextStyle>;
        inputWrapper: StyleProp<ViewStyle>;
        datePickerButton: StyleProp<ViewStyle>;
        dateIcon: StyleProp<ViewStyle>;
        dateInput: StyleProp<TextStyle>;
        fieldError: StyleProp<TextStyle>;
    };
    /**
     * Optional formatting function for ISO date strings.
     * Defaults to local date string.
     */
    formatDate?: (iso: string) => string;
}

const defaultFormatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString();
};

const DatePicker: React.FC<DatePickerProps> = ({
    control,
    name,
    label,
    errors,
    styles,
    formatDate = defaultFormatDate,
}) => {
    const [show, setShow] = useState(false);

    return (
        <Controller
            control={control}
            name={name}
            render={({ field: { onChange, value } }) => (
                <View style={styles.formGroup}>
                    <Text style={styles.label}>{label}</Text>
                    <View style={styles.inputWrapper}>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setShow(true)}
                        >
                            <Calendar size={20} strokeWidth={2} stroke="#6B7280" style={styles.dateIcon} />
                            <Text style={styles.dateInput}>
                                {value ? formatDate(value) : `Select ${label.toLowerCase()}`}
                            </Text>
                        </TouchableOpacity>

                        {show && (
                            <DateTimePicker
                                value={value ? new Date(value) : new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    setShow(false);
                                    if (selectedDate) {
                                        onChange(selectedDate.toISOString());
                                    }
                                }}
                            />
                        )}

                        {errors[name] && (
                            <Text style={styles.fieldError}>
                                {errors[name]?.message as string}
                            </Text>
                        )}
                    </View>
                </View>
            )}
        />
    );
};

export default DatePicker;
