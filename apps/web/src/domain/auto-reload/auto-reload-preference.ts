export type AutoReloadPackSize = 100 | 200 | 1000;

export interface AutoReloadPreference {
  userId: string;
  enabled: boolean;
  packSize: AutoReloadPackSize;
  thresholdCredits: number;
  stripeCustomerId: string | null;
  stripePaymentMethodId: string | null;
}

export function autoReloadPreferenceHasSavedMethod(pref: AutoReloadPreference): boolean {
  return (
    pref.stripeCustomerId != null &&
    pref.stripeCustomerId.length > 0 &&
    pref.stripePaymentMethodId != null &&
    pref.stripePaymentMethodId.length > 0
  );
}
