import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, Pressable, Alert, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ChevronRight, Camera } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import Svg, { Path } from 'react-native-svg';
import { useAuthContext } from '@/context/AuthContext';
import { mettreAJourProfil, uploadAvatar } from '@/lib/api/profil';
import { API_URL, buildImageUrl } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function parseQueryParams(url: string): Record<string, string> {
  const questionIdx = url.indexOf('?');
  if (questionIdx === -1) return {};
  const query = url.slice(questionIdx + 1);
  const params: Record<string, string> = {};
  query.split('&').forEach((pair) => {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) return;
    params[decodeURIComponent(pair.slice(0, eqIdx))] = decodeURIComponent(pair.slice(eqIdx + 1));
  });
  return params;
}

const schema = z.object({
  prenom: z.string().min(1, 'Prenom requis'),
  nom: z.string().min(1, 'Nom requis'),
  telephone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ROLE_LABEL: Record<string, string> = {
  responsable: 'Responsable',
  coordo: 'Coordinateur',
  benevole: 'Benevole',
  beneficiaire: 'Beneficiaire',
};

export default function MonCompteScreen() {
  const router = useRouter();
  const { user, refresh } = useAuthContext();
  const [success, setSuccess] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [linkGoogleLoading, setLinkGoogleLoading] = useState(false);

  async function handleLinkGoogle() {
    setLinkGoogleLoading(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_URL}/api/auth/google/link-mobile-init`,
        'soliviomobile://',
      );
      if (result.type !== 'success' || !result.url) return;
      const params = parseQueryParams(result.url);
      if (params.linked === 'true') {
        await refresh();
        Alert.alert('Succes', 'Votre compte Google a ete lie avec succes.');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de lier le compte Google.');
    } finally {
      setLinkGoogleLoading(false);
    }
  }

  const estBeneficiaire = user?.roles.includes('beneficiaire');
  const initiales =
    user ? `${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`.toUpperCase() : '??';
  const currentAvatarUrl = avatarUri ?? buildImageUrl(user?.photoUrl);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      prenom: user?.prenom ?? '',
      nom: user?.nom ?? '',
      telephone: user?.telephone ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: mettreAJourProfil,
    onSuccess: async () => {
      await refresh();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? 'Impossible de mettre a jour le profil.');
    },
  });

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusee', "L'acces a la galerie est necessaire pour changer la photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setAvatarUri(uri);
    setAvatarUploading(true);
    try {
      await uploadAvatar(uri);
      await refresh();
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? "Impossible d'envoyer la photo.");
      setAvatarUri(null);
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Mon compte" />
      <SafeAreaView edges={['bottom']} className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView
          contentContainerClassName="px-4 py-6 gap-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View className="items-center gap-3">
            <Pressable
              onPress={pickAvatar}
              disabled={avatarUploading}
              style={({ pressed }) => pressed ? { opacity: 0.75 } : null}
            >
              <View className="w-20 h-20 rounded-full bg-teal-100 items-center justify-center overflow-hidden">
                {currentAvatarUrl ? (
                  <Image
                    source={{ uri: currentAvatarUrl }}
                    style={{ width: 80, height: 80, borderRadius: 40 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-2xl font-bold text-teal-700">{initiales}</Text>
                )}
              </View>
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: '#0D9488',
                  borderWidth: 2,
                  borderColor: '#F8FAFC',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={13} color="#fff" />
              </View>
            </Pressable>
            <Text className="text-sm text-muted-foreground">{user?.email}</Text>
          </View>

          {success ? (
            <View className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
              <Text className="text-sm text-teal-700 font-medium">Profil mis a jour.</Text>
            </View>
          ) : null}

          {/* Formulaire */}
          <View className="gap-4">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="prenom"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input
                      label="Prenom"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.prenom?.message}
                      autoCapitalize="words"
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={control}
                  name="nom"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input
                      label="Nom"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.nom?.message}
                      autoCapitalize="words"
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="telephone"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Telephone"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.telephone?.message}
                  keyboardType="phone-pad"
                  placeholder="+33 6 12 34 56 78"
                />
              )}
            />

            <Button
              onPress={handleSubmit((d) => mutation.mutate(d))}
              loading={isSubmitting || mutation.isPending}
              disabled={!isDirty}
              size="lg"
            >
              Enregistrer
            </Button>
          </View>

          {/* Lien profil beneficiaire */}
          {estBeneficiaire && (
            <Pressable
              onPress={() => router.push('/(app)/mon-compte/profil-beneficiaire')}
              className="flex-row items-center gap-3 border border-border rounded-xl px-4 py-3.5 active:bg-muted"
            >
              <Text className="flex-1 text-base font-medium text-foreground">
                Profil beneficiaire
              </Text>
              <ChevronRight size={16} color="#9ca3af" />
            </Pressable>
          )}

          {/* Liaison Google : uniquement pour les comptes email/mot de passe */}
          {user?.authMethod === 'password' ? (
            <Pressable
              onPress={handleLinkGoogle}
              disabled={linkGoogleLoading}
              className="flex-row items-center gap-3 border border-border rounded-xl px-4 py-3.5 active:bg-muted"
            >
              {linkGoogleLoading ? (
                <ActivityIndicator size="small" color="#0D9488" style={{ width: 18, height: 18 }} />
              ) : (
                <GoogleIcon />
              )}
              <Text className="flex-1 text-base font-medium text-foreground">
                Lier votre compte Google
              </Text>
              <ChevronRight size={16} color="#9ca3af" />
            </Pressable>
          ) : null}

          {/* Metadonnees du compte */}
          <View className="gap-3">
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Informations du compte
            </Text>
            <View className="bg-muted/50 rounded-xl overflow-hidden">
              {user?.roles && user.roles.length > 0 && (
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/50">
                  <Text className="text-sm text-muted-foreground">Roles</Text>
                  <Text className="text-sm font-medium text-foreground text-right flex-shrink ml-4" numberOfLines={2}>
                    {user.roles.map((r) => ROLE_LABEL[r] ?? r).join(', ')}
                  </Text>
                </View>
              )}
              {user?.tenantActif && (
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/50">
                  <Text className="text-sm text-muted-foreground">Association</Text>
                  <Text className="text-sm font-medium text-foreground ml-4" numberOfLines={1}>
                    {user.tenantActif}
                  </Text>
                </View>
              )}
              {user?.superAdmin && (
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/50">
                  <Text className="text-sm text-muted-foreground">Acces</Text>
                  <Text className="text-sm font-medium text-foreground ml-4">Super administrateur</Text>
                </View>
              )}
              {user?.id && (
                <View className="flex-row items-center justify-between px-4 py-3">
                  <Text className="text-sm text-muted-foreground">Identifiant</Text>
                  <Text
                    className="text-xs font-mono text-muted-foreground ml-4"
                    numberOfLines={1}
                    style={{ maxWidth: 180 }}
                  >
                    {user.id}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
