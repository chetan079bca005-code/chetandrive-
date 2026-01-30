import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Colors } from '../../config/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: 'bg-primary active:bg-primary-dark',
          text: 'text-secondary font-semibold',
        };
      case 'secondary':
        return {
          container: 'bg-secondary active:bg-secondary-light',
          text: 'text-white font-semibold',
        };
      case 'outline':
        return {
          container: 'bg-transparent border-2 border-secondary',
          text: 'text-secondary font-semibold',
        };
      case 'ghost':
        return {
          container: 'bg-transparent',
          text: 'text-secondary font-medium',
        };
      default:
        return {
          container: 'bg-primary',
          text: 'text-secondary font-semibold',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'py-2 px-4',
          text: 'text-sm',
        };
      case 'md':
        return {
          container: 'py-3 px-6',
          text: 'text-base',
        };
      case 'lg':
        return {
          container: 'py-4 px-8',
          text: 'text-lg',
        };
      default:
        return {
          container: 'py-3 px-6',
          text: 'text-base',
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`
        ${variantStyles.container}
        ${sizeStyles.container}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50' : ''}
        rounded-xl flex-row items-center justify-center
        ${className}
      `}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.secondary : Colors.white}
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && iconPosition === 'left' && (
            <View className="mr-2">{icon}</View>
          )}
          <Text className={`${variantStyles.text} ${sizeStyles.text}`}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <View className="ml-2">{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Button;
