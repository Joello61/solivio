import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, Clock, X, Check } from 'lucide-react-native';

type Mode = 'date' | 'datetime' | 'time';

interface DatePickerInputProps {
  label?: string;
  value?: string | null;
  onChange: (value: string) => void;
  mode?: Mode;
  error?: string;
  helper?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
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
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  const d = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const t = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${d} à ${t}`;
}

/* ------------------------------------------------------------------ */
/*  Composant                                                           */
/* ------------------------------------------------------------------ */
export function DatePickerInput({
  label,
  value,
  onChange,
  mode = 'date',
  error,
  helper,
  minimumDate,
  maximumDate,
}: DatePickerInputProps) {
  const insets = useSafeAreaInsets();
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
    mode === 'date'
      ? 'Sélectionner une date'
      : mode === 'time'
      ? "Sélectionner une heure"
      : 'Sélectionner une date et heure';
  const sheetTitle =
    mode === 'date'
      ? 'Choisir une date'
      : mode === 'time'
      ? "Choisir l'heure"
      : "Choisir la date et l'heure";
  const Icon = mode === 'time' ? Clock : CalendarDays;

  return (
    <>
      {/* ── Champ déclencheur ───────────────────────────────────── */}
      <View style={{ gap: 6 }}>
        {label ? (
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#0F172A' }}>{label}</Text>
        ) : null}

        <Pressable onPress={handleOpen}>
          {({ pressed }) => (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderWidth: 1,
                borderColor: error ? '#EF4444' : '#E2E8F0',
                borderRadius: 12,
                paddingHorizontal: 16,
                minHeight: 52,
                backgroundColor: pressed ? '#F1F5F9' : '#FFFFFF',
              }}
            >
              <Icon size={18} color={value ? '#0D9488' : '#94A3B8'} />
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: value ? '#0F172A' : '#94A3B8',
                  paddingVertical: 14,
                }}
              >
                {displayText ?? placeholder}
              </Text>
            </View>
          )}
        </Pressable>

        {error ? (
          <Text style={{ fontSize: 12, color: '#EF4444', marginLeft: 2 }}>{error}</Text>
        ) : helper ? (
          <Text style={{ fontSize: 12, color: '#64748B', marginLeft: 2 }}>{helper}</Text>
        ) : null}
      </View>

      {/* ── iOS : bottom sheet ──────────────────────────────────── */}
      {Platform.OS === 'ios' && show ? (
        <Modal transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <View style={{ flex: 1 }}>
            {/* Overlay */}
            <Pressable
              style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.35)' }}
              onPress={() => setShow(false)}
            />

            {/* Feuille */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: Math.max(insets.bottom, 24),
                // Ombre subtile
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
              }}
            >
              {/* ── En-tête ── */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingTop: 20,
                  paddingBottom: 8,
                }}
              >
                {/* Annuler */}
                <Pressable
                  onPress={() => setShow(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 8,
                        backgroundColor: pressed ? '#F1F5F9' : 'transparent',
                      }}
                    >
                      <X size={15} color="#64748B" />
                      <Text style={{ fontSize: 15, color: '#64748B', fontWeight: '500' }}>
                        Annuler
                      </Text>
                    </View>
                  )}
                </Pressable>

                {/* Titre centré */}
                <Text
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#0F172A',
                  }}
                >
                  {sheetTitle}
                </Text>

                {/* Confirmer */}
                <Pressable
                  onPress={handleConfirmIOS}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 8,
                        backgroundColor: pressed ? '#F0FDFA' : 'transparent',
                      }}
                    >
                      <Check size={15} color="#0D9488" strokeWidth={2.5} />
                      <Text style={{ fontSize: 15, color: '#0D9488', fontWeight: '700' }}>
                        OK
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Séparateur */}
              <View style={{ height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 20 }} />

              {/* ── Picker ── */}
              <DateTimePicker
                value={tempDate}
                mode={mode}
                display="spinner"
                onChange={(_, date) => {
                  if (date) setTempDate(date);
                }}
                locale="fr-FR"
                minimumDate={mode === 'time' ? undefined : minimumDate}
                maximumDate={mode === 'time' ? undefined : maximumDate}
                // Force le thème clair : texte foncé sur fond blanc
                textColor="#0F172A"
                accentColor="#0D9488"
                themeVariant="light"
                style={{ height: 220, width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      ) : null}

      {/* ── Android : dialog natif ──────────────────────────────── */}
      {Platform.OS === 'android' && show ? (
        <DateTimePicker
          value={tempDate}
          mode={mode === 'datetime' ? (androidStep === 'time' ? 'time' : 'date') : mode}
          is24Hour
          minimumDate={mode === 'time' ? undefined : minimumDate}
          maximumDate={mode === 'time' ? undefined : maximumDate}
          onChange={handleAndroidChange}
          accentColor="#0D9488"
          themeVariant="light"
        />
      ) : null}
    </>
  );
}
