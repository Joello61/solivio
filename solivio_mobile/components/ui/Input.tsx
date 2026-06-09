import { TextInput, View, Text, TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="gap-2">
      {label && <Text className="text-base font-medium text-foreground">{label}</Text>}
      <TextInput
        className={cn(
          'border border-input rounded-xl px-4 py-4 text-base text-foreground bg-background',
          'focus:border-primary-600',
          error && 'border-destructive',
          className,
        )}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-sm text-destructive">{error}</Text>}
    </View>
  );
}
