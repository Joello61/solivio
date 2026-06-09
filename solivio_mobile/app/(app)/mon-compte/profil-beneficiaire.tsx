import { ScrollView, Text, View, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { lireProfilBeneficiaire, mettreAJourProfilBeneficiaire } from '@/lib/api/profil';
import { Input } from '@/components/ui/Input';
import { DatePickerInput } from '@/components/ui/DatePickerInput';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

type SelectOption = { label: string; value: string };

const NATIONALITES: SelectOption[] = [
  { label: 'Francaise', value: 'francaise' },
  { label: 'Ressortissant UE', value: 'ressortissant_ue' },
  { label: 'Hors UE', value: 'hors_ue' },
];

const LOGEMENTS: SelectOption[] = [
  { label: 'Seul(e)', value: 'seul' },
  { label: 'Colocation', value: 'colocation' },
  { label: 'Chez les parents', value: 'chez_parents' },
  { label: 'Residence', value: 'residence' },
  { label: 'Sans domicile stable', value: 'sans_domicile_stable' },
  { label: 'Autre', value: 'autre' },
];

const NIVEAUX: SelectOption[] = [
  { label: 'L1', value: 'L1' },
  { label: 'L2', value: 'L2' },
  { label: 'L3', value: 'L3' },
  { label: 'M1', value: 'M1' },
  { label: 'M2', value: 'M2' },
  { label: 'Doctorat', value: 'doctorat' },
  { label: 'BTS', value: 'BTS' },
  { label: 'Autre', value: 'autre' },
];

function ChipSelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SelectOption[];
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-full border ${
              value === opt.value
                ? 'bg-primary-600 border-primary-600'
                : 'border-border bg-background'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                value === opt.value ? 'text-white' : 'text-foreground'
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const schema = z.object({
  dateNaissance: z.string().nullable().optional(),
  categorieNationalite: z.string().nullable().optional(),
  statutBoursier: z.string().nullable().optional(),
  echelonBourse: z.string().nullable().optional(),
  resteAVivreMensuel: z.string().nullable().optional(),
  niveauAcademique: z.string().nullable().optional(),
  etablissement: z.string().nullable().optional(),
  situationLogement: z.string().nullable().optional(),
  aEmploiEtudiant: z.boolean().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfilBeneficiaireScreen() {
  const queryClient = useQueryClient();

  const { data: profil, isLoading } = useQuery({
    queryKey: ['profil-beneficiaire'],
    queryFn: lireProfilBeneficiaire,
  });

  const mutation = useMutation({
    mutationFn: mettreAJourProfilBeneficiaire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profil-beneficiaire'] });
      Alert.alert('Succes', 'Profil mis a jour.');
    },
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? 'Impossible de mettre a jour le profil.');
    },
  });

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: profil
      ? {
          dateNaissance: profil.dateNaissance,
          categorieNationalite: profil.categorieNationalite,
          statutBoursier: profil.statutBoursier,
          echelonBourse: profil.echelonBourse != null ? String(profil.echelonBourse) : null,
          resteAVivreMensuel: profil.resteAVivreMensuel != null ? String(profil.resteAVivreMensuel) : null,
          niveauAcademique: profil.niveauAcademique,
          etablissement: profil.etablissement,
          situationLogement: profil.situationLogement,
          aEmploiEtudiant: profil.aEmploiEtudiant,
        }
      : {},
  });

  const statutBoursier = watch('statutBoursier');

  if (isLoading) return <Spinner fullScreen />;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Profil beneficiaire" />
      <SafeAreaView edges={['bottom']} className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center gap-2">
          <Text className="text-sm text-muted-foreground">Statut :</Text>
          <Badge variant={profil?.complet ? 'success' : 'warning'}>
            {profil?.complet ? 'Complet' : 'Incomplet'}
          </Badge>
        </View>

        <Controller
          control={control}
          name="dateNaissance"
          render={({ field: { value, onChange } }) => (
            <DatePickerInput
              label="Date de naissance"
              value={value}
              onChange={onChange}
              mode="date"
              maximumDate={new Date()}
            />
          )}
        />

        <Controller
          control={control}
          name="categorieNationalite"
          render={({ field: { value, onChange } }) => (
            <ChipSelector
              label="Nationalite"
              options={NATIONALITES}
              value={value}
              onChange={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="statutBoursier"
          render={({ field: { value, onChange } }) => (
            <ChipSelector
              label="Statut boursier"
              options={[
                { label: 'Boursier(e)', value: 'boursier' },
                { label: 'Non boursier(e)', value: 'non_boursier' },
              ]}
              value={value}
              onChange={onChange}
            />
          )}
        />

        {statutBoursier === 'boursier' && (
          <Controller
            control={control}
            name="echelonBourse"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Echelon de bourse (0-7)"
                value={value != null ? String(value) : ''}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="number-pad"
                placeholder="0"
              />
            )}
          />
        )}

        <Controller
          control={control}
          name="resteAVivreMensuel"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Reste a vivre mensuel (euros)"
              value={value != null ? String(value) : ''}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              placeholder="500"
            />
          )}
        />

        <Controller
          control={control}
          name="niveauAcademique"
          render={({ field: { value, onChange } }) => (
            <ChipSelector
              label="Niveau academique"
              options={NIVEAUX}
              value={value}
              onChange={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="etablissement"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Etablissement"
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Universite Paris..."
            />
          )}
        />

        <Controller
          control={control}
          name="situationLogement"
          render={({ field: { value, onChange } }) => (
            <ChipSelector
              label="Situation de logement"
              options={LOGEMENTS}
              value={value}
              onChange={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="aEmploiEtudiant"
          render={({ field: { value, onChange } }) => (
            <ChipSelector
              label="Emploi etudiant"
              options={[
                { label: 'Oui', value: 'true' },
                { label: 'Non', value: 'false' },
              ]}
              value={value != null ? String(value) : null}
              onChange={(v) => onChange(v === 'true')}
            />
          )}
        />

        <Button
          onPress={handleSubmit((d) => mutation.mutate({
            ...d,
            echelonBourse: d.echelonBourse ? Number(d.echelonBourse) : null,
            resteAVivreMensuel: d.resteAVivreMensuel ? Number(d.resteAVivreMensuel) : null,
          }))}
          loading={mutation.isPending}
          size="lg"
          className="mt-2"
        >
          Enregistrer
        </Button>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}
