import { apiPost } from '@/lib/api';

export type CibleEmail =
  | 'BENEVOLES'
  | 'BENEFICIAIRES'
  | 'COORDINATEURS'
  | 'RESPONSABLES'
  | 'TOUS';

export interface EmailLibrePayload {
  cible: CibleEmail;
  sujet: string;
  corps: string;
}

export function envoyerEmailLibre(payload: EmailLibrePayload): Promise<void> {
  return apiPost<void>('/api/notifications/email-libre', payload);
}
