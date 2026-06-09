export interface TenantSummary {
  slug: string;
  nom: string;
  role: string;
  coordoType: string | null;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  tenants: TenantSummary[];
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
  tenantActif: string | null;
  roles: string[];
}

export interface ApiError {
  title: string;
  detail?: string;
  status: number;
}
