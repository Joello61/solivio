import { KeyboardAvoidingView, Platform, ScrollView, Text, View, Alert } from 'react-native';
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
import { SelectionGroup } from '@/components/ui/SelectionGroup';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';

/* ------------------------------------------------------------------ */
/*  Types et données                                                    */
/* ------------------------------------------------------------------ */
type SelectOption = { label: string; value: string };

const NATIONALITES: SelectOption[] = [
  { label: 'Française', value: 'francaise' },
  { label: 'Ressortissant UE', value: 'ressortissant_ue' },
  { label: 'Hors UE', value: 'hors_ue' },
];

const LOGEMENTS: SelectOption[] = [
  { label: 'Seul(e)', value: 'seul' },
  { label: 'Colocation', value: 'colocation' },
  { label: 'Chez les parents', value: 'chez_parents' },
  { label: 'Résidence', value: 'residence' },
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



/* ------------------------------------------------------------------ */
/*  Composant SectionCard                                               */
/* ------------------------------------------------------------------ */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-card rounded-2xl border border-border/60 overflow-hidden">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </Text>
      </View>
      <View className="px-4 pb-4 gap-4">{children}</View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Schéma Zod                                                          */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Écran principal                                                     */
/* ------------------------------------------------------------------ */
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
      Alert.alert('Succès', 'Profil mis à jour avec succès.');
    },
    onError: (err: unknown) => {
      const e = err as { detail?: string; message?: string };
      Alert.alert('Erreur', e.detail ?? e.message ?? 'Impossible de mettre à jour le profil.');
    },
  });

  const {
    control,
    handleSubmit,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: profil
      ? {
          dateNaissance: profil.dateNaissance,
          categorieNationalite: profil.categorieNationalite,
          statutBoursier: profil.statutBoursier,
          echelonBourse: profil.echelonBourse != null ? String(profil.echelonBourse) : null,
          resteAVivreMensuel:
            profil.resteAVivreMensuel != null ? String(profil.resteAVivreMensuel) : null,
          niveauAcademique: profil.niveauAcademique,
          etablissement: profil.etablissement,
          situationLogement: profil.situationLogement,
          aEmploiEtudiant: profil.aEmploiEtudiant,
        }
      : {},
  });

  const statutBoursier = watch('statutBoursier');

  if (isLoading) return <Spinner fullScreen />;

  const estComplet = profil?.complet ?? false;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Profil bénéficiaire" />
      <SafeAreaView edges={['bottom']} className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-4 py-4 gap-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Bannière statut */}
            <View
              className={[
                'flex-row items-center gap-3 px-4 py-3 rounded-xl border',
                estComplet
                  ? 'bg-primary/8 border-primary/20'
                  : 'bg-amber-50 border-amber-200',
              ].join(' ')}
            >
              {estComplet ? (
                <CheckCircle2 size={18} color="#0D9488" />
              ) : (
                <AlertCircle size={18} color="#F59E0B" />
              )}
              <View className="flex-1">
                <Text
                  className={[
                    'text-sm font-semibold',
                    estComplet ? 'text-primary' : 'text-amber-700',
                  ].join(' ')}
                >
                  {estComplet ? 'Profil complet' : 'Profil incomplet'}
                </Text>
                {!estComplet && (
                  <Text className="text-xs text-amber-600 mt-0.5">
                    Renseignez tous les champs pour accéder à toutes les fonctionnalités.
                  </Text>
                )}
              </View>
              <Badge variant={estComplet ? 'success' : 'warning'}>
                {estComplet ? 'Complet' : 'À compléter'}
              </Badge>
            </View>

            {/* Section : Identité */}
            <SectionCard title="Identité">
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
                  <SelectionGroup
                    label="Nationalité"
                    options={NATIONALITES}
                    value={value}
                    onChange={onChange}
                    variant="list"
                  />
                )}
              />
            </SectionCard>

            {/* Section : Situation financière */}
            <SectionCard title="Situation financière">
              <Controller
                control={control}
                name="statutBoursier"
                render={({ field: { value, onChange } }) => (
                  <SelectionGroup
                    label="Statut boursier"
                    options={[
                      { label: 'Boursier(e)', value: 'boursier' },
                      { label: 'Non boursier(e)', value: 'non_boursier' },
                    ]}
                    value={value}
                    onChange={onChange}
                    variant="list"
                  />
                )}
              />

              {statutBoursier === 'boursier' && (
                <Controller
                  control={control}
                  name="echelonBourse"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input
                      label="Échelon de bourse (0–7)"
                      value={value != null ? String(value) : ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                      placeholder="ex : 3"
                    />
                  )}
                />
              )}

              <Controller
                control={control}
                name="resteAVivreMensuel"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Reste à vivre mensuel (€)"
                    value={value != null ? String(value) : ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="decimal-pad"
                    placeholder="ex : 500"
                  />
                )}
              />

              <Controller
                control={control}
                name="aEmploiEtudiant"
                render={({ field: { value, onChange } }) => (
                  <SelectionGroup
                    label="Emploi étudiant"
                    options={[
                      { label: 'Oui', value: 'true' },
                      { label: 'Non', value: 'false' },
                    ]}
                    value={value != null ? String(value) : null}
                    onChange={(v) => onChange(v === 'true')}
                    variant="chips"
                  />
                )}
              />
            </SectionCard>

            {/* Section : Parcours académique */}
            <SectionCard title="Parcours académique">
              <Controller
                control={control}
                name="niveauAcademique"
                render={({ field: { value, onChange } }) => (
                  <SelectionGroup
                    label="Niveau académique"
                    options={NIVEAUX}
                    value={value}
                    onChange={onChange}
                    variant="chips"
                  />
                )}
              />

              <Controller
                control={control}
                name="etablissement"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Établissement"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="ex : Université Paris Cité"
                  />
                )}
              />
            </SectionCard>

            {/* Section : Logement */}
            <SectionCard title="Logement">
              <Controller
                control={control}
                name="situationLogement"
                render={({ field: { value, onChange } }) => (
                  <SelectionGroup
                    label="Situation de logement"
                    options={LOGEMENTS}
                    value={value}
                    onChange={onChange}
                    variant="list"
                  />
                )}
              />
            </SectionCard>

            {/* Bouton enregistrer */}
            <Button
              onPress={handleSubmit((d) =>
                mutation.mutate({
                  ...d,
                  echelonBourse: d.echelonBourse ? Number(d.echelonBourse) : null,
                  resteAVivreMensuel: d.resteAVivreMensuel ? Number(d.resteAVivreMensuel) : null,
                })
              )}
              loading={mutation.isPending}
              size="lg"
              fullWidth
              className="mt-2"
            >
              Enregistrer le profil
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
