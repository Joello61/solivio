import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View, useColorScheme } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, Clock } from 'lucide-react-native';
import { cn } from '@/lib/utils';

type Mode = 'date' | 'datetime' | 'time';

interface DatePickerInputProps {
  label?: string;
  value?: string | null;
  onChange: (value: string) => void;
  mode?: Mode;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toLocalISODateTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${toLocalISODate(date)}T${h}:${min}:00`;
}

function toLocalHHMM(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function parseToDate(value: string, mode: Mode): Date {
  if (mode === 'time') {
    const [h, m] = value.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }
  return new Date(value);
}

function formatDisplay(value: string, mode: Mode): string {
  if (mode === 'time') return value;
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  if (mode === 'date') {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  const d = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const t = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${d} a ${t}`;
}

export function DatePickerInput({
  label,
  value,
  onChange,
  mode = 'date',
  error,
  minimumDate,
  maximumDate,
}: DatePickerInputProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [show, setShow] = useState(false);
  const [androidStep, setAndroidStep] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date>(() =>
    value ? parseToDate(value, mode) : new Date(),
  );

  function handleOpen() {
    setTempDate(value ? parseToDate(value, mode) : new Date());
    if (mode === 'datetime') setAndroidStep('date');
    setShow(true);
  }

  function handleConfirmIOS() {
    if (mode === 'date') onChange(toLocalISODate(tempDate));
    else if (mode === 'datetime') onChange(toLocalISODateTime(tempDate));
    else onChange(toLocalHHMM(tempDate));
    setShow(false);
  }

  function handleAndroidChange(event: DateTimePickerEvent, date?: Date) {
    if (event.type === 'dismissed' || !date) {
      setShow(false);
      setAndroidStep('date');
      return;
    }
    if (mode === 'date') {
      onChange(toLocalISODate(date));
      setShow(false);
    } else if (mode === 'time') {
      onChange(toLocalHHMM(date));
      setShow(false);
    } else if (androidStep === 'date') {
      setTempDate(date);
      setAndroidStep('time');
    } else {
      const combined = new Date(tempDate);
      combined.setHours(date.getHours(), date.getMinutes(), 0, 0);
      onChange(toLocalISODateTime(combined));
      setShow(false);
      setAndroidStep('date');
    }
  }

  const displayText = value ? formatDisplay(value, mode) : null;
  const placeholder =
    mode === 'date' ? 'Selectionnez une date' :
    mode === 'time' ? 'Selectionnez une heure' :
    'Selectionnez une date et heure';
  const sheetTitle =
    mode === 'date' ? 'Choisir une date' :
    mode === 'time' ? "Choisir l'heure" :
    "Choisir la date et l'heure";
  const Icon = mode === 'time' ? Clock : CalendarDays;

  return (
    <>
      <View className="gap-2">
        {label && (
          <Text className="text-base font-medium text-foreground">{label}</Text>
        )}
        <Pressable
          onPress={handleOpen}
          className={cn(
            'flex-row items-center gap-3 border rounded-xl px-4 py-4 bg-background active:bg-muted',
            error ? 'border-destructive' : 'border-input',
          )}
        >
          <Icon size={18} color={value ? '#1C2B24' : '#9ca3af'} />
          <Text className={cn('flex-1 text-base', value ? 'text-foreground' : 'text-muted-foreground')}>
            {displayText ?? placeholder}
          </Text>
        </Pressable>
        {error && <Text className="text-sm text-destructive">{error}</Text>}
      </View>

      {/* iOS : bottom sheet */}
      {Platform.OS === 'ios' && show && (
        <Modal transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <View style={{ flex: 1 }}>
            <Pressable
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }}
              onPress={() => setShow(false)}
            />
            <View
              style={{
                backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: Math.max(insets.bottom, 16),
              }}
            >
              <View className="flex-row items-center justify-between px-5 pt-5 pb-1">
                <Pressable onPress={() => setShow(false)} className="px-2 py-1">
                  <Text className="text-base text-muted-foreground">Annuler</Text>
                </Pressable>
                <Text className="text-base font-semibold text-foreground">{sheetTitle}</Text>
                <Pressable onPress={handleConfirmIOS} className="px-2 py-1">
                  <Text className="text-base font-semibold text-primary">OK</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                mode={mode}
                display="spinner"
                onChange={(_, date) => { if (date) setTempDate(date); }}
                locale="fr-FR"
                minimumDate={mode === 'time' ? undefined : minimumDate}
                maximumDate={mode === 'time' ? undefined : maximumDate}
                textColor={isDark ? '#ffffff' : '#1C2B24'}
                style={{ height: 216, width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android : dialog natif */}
      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={tempDate}
          mode={mode === 'datetime' ? (androidStep === 'time' ? 'time' : 'date') : mode}
          is24Hour
          minimumDate={mode === 'time' ? undefined : minimumDate}
          maximumDate={mode === 'time' ? undefined : maximumDate}
          onChange={handleAndroidChange}
        />
      )}
    </>
  );
}
