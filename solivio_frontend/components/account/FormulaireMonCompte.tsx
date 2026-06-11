"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      setErreur(e.detail ?? e.message ?? "Erreur lors de la mise a jour.");
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
    <div className="space-y-8">
      {/* Photo de profil */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="relative h-20 w-20 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center overflow-hidden ring-2 ring-teal-100 dark:ring-teal-800/40">
            {avatarSrc ? (
              <Image src={avatarSrc} alt="Photo de profil" fill sizes="80px" className="object-cover" />
            ) : (
              <span className="text-2xl font-semibold text-primary">{initiales}</span>
            )}
            {/* Overlay pendant l'upload */}
            {uploadPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                <Spinner size="default" className="text-white" />
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
        <div>
          <p className="font-semibold text-sm">
            {user.prenom} {user.nom}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          {uploadPending && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Spinner size="sm" />
              Chargement de la photo...
            </p>
          )}
          {!uploadPending && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1.5 text-xs text-primary hover:underline"
            >
              Modifier la photo
            </button>
          )}
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="prenom">Prenom</Label>
            <Input
              id="prenom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              maxLength={100}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user.email} disabled className="bg-muted/50 cursor-not-allowed" />
          <p className="text-xs text-muted-foreground">
            L&apos;adresse email ne peut pas etre modifiee ici.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telephone">Telephone</Label>
          <Input
            id="telephone"
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            maxLength={30}
            placeholder="ex : 0600000000"
          />
        </div>

        {succes && (
          <div className="flex items-center gap-2.5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-teal-800 dark:bg-teal-950/20 dark:border-teal-800/40 dark:text-teal-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm">Profil mis a jour avec succes.</span>
          </div>
        )}
        {erreur && <Alert variant="destructive">{erreur}</Alert>}

        <Button type="submit" disabled={pending}>
          {pending ? <><Spinner size="sm" /> Enregistrement...</> : "Enregistrer"}
        </Button>
      </form>
    </div>
  );
}
