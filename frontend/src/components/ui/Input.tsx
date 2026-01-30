import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors } from '../../config/colors';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  className?: string;
  inputClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  leftIcon,
  rightIcon,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  className = '',
  inputClassName = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-gray-700 font-medium mb-2 text-sm">{label}</Text>
      )}
      <View
        className={`
          flex-row items-center
          bg-gray-100 rounded-xl
          border-2
          ${isFocused ? 'border-primary' : error ? 'border-danger' : 'border-transparent'}
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {leftIcon && (
          <View className="pl-4">{leftIcon}</View>
        )}
        <TextInput
          className={`
            flex-1 py-4 px-4 text-base text-secondary
            ${inputClassName}
          `}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray500}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            className="pr-4"
          >
            {isSecure ? (
              <EyeOff size={20} color={Colors.gray500} />
            ) : (
              <Eye size={20} color={Colors.gray500} />
            )}
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && (
          <View className="pr-4">{rightIcon}</View>
        )}
      </View>
      {error && (
        <Text className="text-danger text-sm mt-1">{error}</Text>
      )}
    </View>
  );
};

export default Input;
