import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertCircle, Check } from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import { switchTenant } from '@/lib/auth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';

const SELECTED_SHADOW = {
  shadowColor: '#0D9488',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.14,
  shadowRadius: 12,
  elevation: 4,
} as const;

const DEFAULT_SHADOW = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 1,
} as const;

export default function TenantSelectScreen() {
  const router = useRouter();
  const { tenants, refresh } = useAuthContext();
  const [selected, setSelected] = useState<string | null>(
    tenants.length === 1 ? tenants[0].slug : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      await switchTenant(selected);
      await refresh();
      router.replace('/(app)/(tabs)');
    } catch {
      setError('Impossible de selectionner cette association.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Choisir une association"
      description="Votre compte est associe a plusieurs associations."
    >
      <View className="gap-4">
        {error ? (
          <View className="flex-row items-start gap-3 bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} color="#EF4444" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

        <View className="gap-3">
          {tenants.map((tenant) => {
            const isSelected = selected === tenant.slug;
            const initials = tenant.nom
              .split(' ')
              .slice(0, 2)
              .map((w: string) => w[0]?.toUpperCase() ?? '')
              .join('');

            return (
              <Pressable
                key={tenant.slug}
                onPress={() => setSelected(tenant.slug)}
                style={({ pressed }) =>
                  pressed ? { opacity: 0.82, transform: [{ scale: 0.985 }] } : null
                }
              >
                <View
                  style={[
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#0D9488' : '#E2E8F0',
                      backgroundColor: isSelected ? '#F0FDFA' : '#FFFFFF',
                    },
                    isSelected ? SELECTED_SHADOW : DEFAULT_SHADOW,
                  ]}
                >
                  {/* Avatar initiales */}
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: isSelected ? '#0D9488' : '#F1F5F9',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: isSelected ? '#FFFFFF' : '#64748B',
                        letterSpacing: 0.5,
                      }}
                    >
                      {initials || '?'}
                    </Text>
                  </View>

                  {/* Nom + role */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: '#0F172A',
                        marginBottom: 2,
                      }}
                    >
                      {tenant.nom}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: '#64748B',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tenant.role}
                    </Text>
                  </View>

                  {/* Indicateur radio */}
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: isSelected ? 0 : 1.5,
                      borderColor: '#CBD5E1',
                      backgroundColor: isSelected ? '#0D9488' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Button onPress={onConfirm} loading={loading} disabled={!selected} size="lg" fullWidth>
          Continuer
        </Button>
      </View>
    </AuthLayout>
  );
}
