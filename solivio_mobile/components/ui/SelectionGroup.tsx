import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

type Option = { label: string; value: string };

interface SelectionGroupProps {
  label: string;
  options: Option[];
  value: string | null | undefined;
  onChange: (v: string) => void;
  /**
   * 'chips' — pastilles horizontales (options courtes : Oui/Non, niveaux)
   * 'list'  — liste verticale avec radio à droite (labels longs : nationalité, logement)
   */
  variant?: 'chips' | 'list';
  helper?: string;
}

export function SelectionGroup({
  label,
  options,
  value,
  onChange,
  variant = 'chips',
  helper,
}: SelectionGroupProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '500', color: '#0F172A' }}>{label}</Text>

      {/* ── Variante chips ─────────────────────────────────────────── */}
      {variant === 'chips' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onChange(opt.value)}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#0D9488' : '#94A3B8',
                      backgroundColor: isSelected
                        ? '#0D9488'
                        : pressed
                        ? '#E2E8F0'
                        : '#F1F5F9',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? '600' : '500',
                        color: isSelected ? '#FFFFFF' : '#334155',
                      }}
                    >
                      {opt.label}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ── Variante list ──────────────────────────────────────────── */}
      {variant === 'list' && (
        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            overflow: 'hidden',
          }}
        >
          {options.map((opt, i) => {
            const isSelected = value === opt.value;
            const isLast = i === options.length - 1;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onChange(opt.value)}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      backgroundColor: isSelected
                        ? '#F0FDFA'
                        : pressed
                        ? '#F8FAFC'
                        : '#FFFFFF',
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: '#E2E8F0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected ? '#0D9488' : '#334155',
                        flex: 1,
                        marginRight: 12,
                      }}
                    >
                      {opt.label}
                    </Text>

                    {/* Radio visuel */}
                    {isSelected ? (
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: '#0D9488',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={13} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    ) : (
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: 1.5,
                          borderColor: '#CBD5E1',
                          backgroundColor: '#F1F5F9',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {helper ? (
        <Text style={{ fontSize: 12, color: '#64748B' }}>{helper}</Text>
      ) : null}
    </View>
  );
}
