export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string | null;
}

export interface MeResponse {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  photoUrl: string | null;
  superAdmin: boolean;
  roles: string[];
  dateCreation: string;
  dateModification: string;
  emailVerifie: boolean;
  authMethod: "google" | "password";
}
