"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";
import { mettreAJourProfil, uploadAvatar } from "@/lib/api/profil";
import type { MeResponse } from "@/types/auth";

interface Props {
  user: MeResponse;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export function FormulaireMonCompte({ user }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nom, setNom] = useState(user.nom);
  const [prenom, setPrenom] = useState(user.prenom);
  const [telephone, setTelephone] = useState(user.telephone ?? "");
  const [pending, setPending] = useState(false);
  const [uploadPending, setUploadPending] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(user.photoUrl);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setErreur(null);
    setSucces(false);
    try {
      await mettreAJourProfil({ nom, prenom, telephone });
      setSucces(true);
      router.refresh();
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur lors de la mise à jour.");
    } finally {
      setPending(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadPending(true);
    setErreur(null);
    try {
      const updated = await uploadAvatar(file);
      setPhotoUrl(updated.photoUrl);
      router.refresh();
    } catch (err) {
      const e = err as { detail?: string; message?: string };
      setErreur(e.detail ?? e.message ?? "Erreur lors du chargement de la photo.");
    } finally {
      setUploadPending(false);
    }
  }

  const avatarSrc = photoUrl ? `${API_URL}${photoUrl}` : null;
  const initiales = `${user.prenom[0] ?? ""}${user.nom[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      {/* Photo de profil */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="relative h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
            {avatarSrc ? (
              <Image src={avatarSrc} alt="Photo de profil" fill sizes="80px" className="object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-primary">{initiales}</span>
            )}
            {/* Overlay pendant l'upload */}
            {uploadPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-overlay/40 rounded-full">
                <Spinner size="default" className="text-on-brand" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPending}
            aria-label="Changer la photo de profil"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {uploadPending ? <Spinner size="sm" className="h-3 w-3" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
            aria-label="Fichier photo de profil"
          />
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold">
            {user.prenom} {user.nom}
          </p>
          <p className="text-sm break-all text-muted-foreground">{user.email}</p>
          {uploadPending && (
            <p className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground">
              <Spinner size="sm" />
              Chargement de la photo...
            </p>
          )}
          {!uploadPending && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Modifier la photo
            </button>
          )}
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Prénom" htmlFor="prenom">
            <Input
              id="prenom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              maxLength={100}
              required
            />
          </FormField>
          <FormField label="Nom" htmlFor="nom">
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              maxLength={100}
              required
            />
          </FormField>
        </div>

        <FormField label="Email" htmlFor="email" hint="L'adresse email sert à vous connecter : elle ne se modifie pas ici.">
          <Input id="email" value={user.email} disabled className="cursor-not-allowed bg-muted" />
        </FormField>

        <FormField label="Téléphone" htmlFor="telephone" hint="Facultatif.">
          <Input
            id="telephone"
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            maxLength={30}
            autoComplete="tel"
          />
        </FormField>

        {succes && (
          <p role="status" className="flex items-center gap-2 text-base font-semibold text-success">
            <CheckCircle aria-hidden="true" className="size-5 shrink-0" />
            Profil mis à jour.
          </p>
        )}
        {erreur && <Alert variant="destructive">{erreur}</Alert>}

        <Button type="submit" disabled={pending}>
          {pending ? <><Spinner size="sm" /> Enregistrement...</> : "Enregistrer"}
        </Button>
      </form>
    </div>
  );
}
