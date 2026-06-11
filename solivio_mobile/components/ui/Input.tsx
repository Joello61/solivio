import { useState } from 'react';
import type { ReactNode } from 'react';
import { TextInput, View, Text, Pressable } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  left?: ReactNode;
  containerClassName?: string;
  className?: string;
}

const FOCUS_SHADOW = {
  shadowColor: '#0D9488',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 0,
} as const;

export function Input({
  label,
  error,
  helper,
  left,
  secureTextEntry,
  containerClassName,
  className,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry === true;

  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label ? (
        <Text className="text-sm font-medium text-foreground">{label}</Text>
      ) : null}

      <View
        className={cn(
          'flex-row items-center min-h-[52px] rounded-xl border bg-card px-4 gap-3',
          focused
            ? 'border-primary'
            : error
            ? 'border-destructive'
            : 'border-input',
        )}
        style={focused ? FOCUS_SHADOW : undefined}
      >
        {left ? <View className="shrink-0">{left}</View> : null}

        <TextInput
          className={cn('flex-1 text-base text-foreground py-3.5', className)}
          placeholderTextColor="#94A3B8"
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={18} color="#94A3B8" />
            ) : (
              <Eye size={18} color="#94A3B8" />
            )}
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text className="text-xs text-destructive ml-0.5">{error}</Text>
      ) : helper ? (
        <Text className="text-xs text-muted-foreground ml-0.5">{helper}</Text>
      ) : null}
    </View>
  );
}
