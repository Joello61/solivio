import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';
import { useAuthContext } from '@/context/AuthContext';
import { switchTenant } from '@/lib/auth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

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
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <Text className="text-sm text-destructive">{error}</Text>
          </View>
        )}

        <View className="gap-3">
          {tenants.map((tenant) => {
            const isSelected = selected === tenant.slug;
            return (
              <Pressable key={tenant.slug} onPress={() => setSelected(tenant.slug)}>
                <Card
                  className={cn(
                    'flex-row items-center gap-3',
                    isSelected && 'border-primary bg-primary-50',
                  )}
                >
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">{tenant.nom}</Text>
                    <Text className="text-sm text-muted-foreground capitalize">{tenant.role}</Text>
                  </View>
                  {isSelected && <CheckCircle size={20} color="#16513F" />}
                </Card>
              </Pressable>
            );
          })}
        </View>

        <Button onPress={onConfirm} loading={loading} disabled={!selected} size="lg">
          Continuer
        </Button>
      </View>
    </AuthLayout>
  );
}
