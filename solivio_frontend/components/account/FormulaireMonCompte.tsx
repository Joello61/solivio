"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
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

  return (
    <div className="space-y-8">
      {/* Photo de profil */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="relative h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border">
            {avatarSrc ? (
              <Image src={avatarSrc} alt="Photo de profil" fill sizes="80px" className="object-cover" />
            ) : (
              <User className="h-9 w-9 text-primary/60" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPending}
            aria-label="Changer la photo de profil"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
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
          <p className="font-medium text-sm">
            {user.prenom} {user.nom}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          {uploadPending && (
            <p className="text-xs text-muted-foreground mt-1">Chargement...</p>
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
          <Alert className="border-green-500/50 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-400">
            Profil mis a jour avec succes.
          </Alert>
        )}
        {erreur && (
          <Alert variant="destructive">{erreur}</Alert>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </div>
  );
}
