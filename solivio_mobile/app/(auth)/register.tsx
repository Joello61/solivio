import { useMemo, useState } from 'react';
import { Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import Svg, { Path } from 'react-native-svg';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { register } from '@/lib/auth';
import { API_URL, setTokens } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import type { TenantSummary } from '@/types/auth';

WebBrowser.maybeCompleteAuthSession();

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
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

// Deux schemas selon le contexte :
// - Avec invitation : code asso inutile (l'asso est determinee par le token)
// - Sans invitation : code asso obligatoire (seul moyen de rejoindre une asso)
const schemaAvecInvitation = z
  .object({
    prenom: z.string().min(1, 'Prenom requis'),
    nom: z.string().min(1, 'Nom requis'),
    email: z.string().email('Email invalide'),
    motDePasse: z.string().min(8, 'Minimum 8 caracteres'),
    confirmerMotDePasse: z.string(),
  })
  .refine((d) => d.motDePasse === d.confirmerMotDePasse, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmerMotDePasse'],
  });

const schemaSansInvitation = z
  .object({
    prenom: z.string().min(1, 'Prenom requis'),
    nom: z.string().min(1, 'Nom requis'),
    email: z.string().email('Email invalide'),
    motDePasse: z.string().min(8, 'Minimum 8 caracteres'),
    confirmerMotDePasse: z.string(),
    codeAssociation: z.string().min(1, 'Code association requis'),
  })
  .refine((d) => d.motDePasse === d.confirmerMotDePasse, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmerMotDePasse'],
  });

type FormAvecInvitation = z.infer<typeof schemaAvecInvitation>;
type FormSansInvitation = z.infer<typeof schemaSansInvitation>;
type FormData = FormAvecInvitation & { codeAssociation?: string };

export default function RegisterScreen() {
  const router = useRouter();
  const { tokenInvitation, googleEmail } = useLocalSearchParams<{
    tokenInvitation?: string;
    googleEmail?: string;
  }>();
  const { refresh, setTenants } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const aInvitation = !!tokenInvitation;
  const schema = useMemo(
    () => (aInvitation ? schemaAvecInvitation : schemaSansInvitation),
    [aInvitation],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: googleEmail ?? '',
    },
  });

  async function onGoogleRegister() {
    setError(null);
    setGoogleLoading(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_URL}/api/auth/google/mobile-init`,
        'soliviomobile://',
      );

      if (result.type !== 'success' || !result.url) return;

      const params = parseQueryParams(result.url);

      if (params.type === 'new_user') {
        router.push({
          pathname: '/(auth)/complete-google-registration',
          params: {
            email: params.email ?? '',
            nom: params.nom ?? '',
            prenom: params.prenom ?? '',
            ...(tokenInvitation ? { tokenInvitation } : {}),
          },
        });
        return;
      }

      // Compte existant : connexion directe
      const accessToken = params.accessToken;
      if (!accessToken) {
        setError('Erreur lors de la connexion avec Google.');
        return;
      }

      await setTokens(accessToken, params.refreshToken || undefined);

      if (params.tenants) {
        const tenantsParsed: TenantSummary[] = JSON.parse(params.tenants);
        if (tenantsParsed.length > 1) {
          setTenants(tenantsParsed);
          router.replace('/(auth)/tenant-select');
          return;
        }
      }

      await refresh();
      router.replace('/(app)/(tabs)');
    } catch {
      setError('Erreur lors de la connexion avec Google.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      await register({
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        motDePasse: data.motDePasse,
        codeAssociation: aInvitation ? undefined : (data as FormSansInvitation).codeAssociation,
        tokenInvitation: tokenInvitation || undefined,
      });
      router.push({ pathname: '/(auth)/verify-email', params: { email: data.email } });
    } catch (err: unknown) {
      const e = err as { detail?: string; message?: string };
      setError(e.detail ?? e.message ?? "Erreur lors de l'inscription.");
    }
  }

  return (
    <AuthLayout title="Creer un compte" description="Rejoignez votre association sur Solivio.">
      <View className="gap-4">
        {aInvitation ? (
          <View className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
            <Text className="text-sm text-teal-700 font-medium">
              {"Invitation detectee - votre compte sera automatiquement lie a l'association."}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View className="flex-row items-start gap-3 bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} color="#EF4444" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-sm text-destructive">{error}</Text>
          </View>
        ) : null}

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
                  placeholder="Marie"
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
                  placeholder="Dupont"
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Adresse email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="vous@exemple.fr"
            />
          )}
        />

        <Controller
          control={control}
          name="motDePasse"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Mot de passe"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.motDePasse?.message}
              secureTextEntry
              placeholder="8 caracteres minimum"
            />
          )}
        />

        <Controller
          control={control}
          name="confirmerMotDePasse"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Confirmer le mot de passe"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmerMotDePasse?.message}
              secureTextEntry
              placeholder="Confirmer"
            />
          )}
        />

        {/* Champ code association : requis si pas d'invitation, cache sinon */}
        {!aInvitation ? (
          <Controller
            control={control}
            name="codeAssociation"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Code association *"
                value={(value as string | undefined) ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={(errors as { codeAssociation?: { message?: string } }).codeAssociation?.message}
                helper="Code fourni par votre association pour rejoindre son espace."
                autoCapitalize="characters"
                placeholder="CODE123"
              />
            )}
          />
        ) : null}

        <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} size="lg" fullWidth>
          Creer mon compte
        </Button>

        {/* Separateur */}
        <View className="flex-row items-center gap-3">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-xs text-muted-foreground">ou</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        {/* Bouton Google */}
        <Pressable
          onPress={onGoogleRegister}
          disabled={googleLoading}
          style={({ pressed }) =>
            pressed ? { opacity: 0.78, transform: [{ scale: 0.98 }] } : null
          }
          className="flex-row items-center justify-center gap-3 h-12 rounded-xl border border-border bg-white"
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color="#64748B" />
          ) : (
            <>
              <GoogleIcon />
              <Text className="text-sm font-semibold text-foreground">
                {"S'inscrire avec Google"}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <View className="flex-row justify-center items-center gap-1.5">
        <Text className="text-sm text-muted-foreground">Deja un compte ?</Text>
        <Pressable
          onPress={() => router.replace('/(auth)/login')}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text className="text-sm text-primary font-semibold">Se connecter</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
