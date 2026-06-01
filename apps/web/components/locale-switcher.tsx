'use client';

import { useI18n, type Locale } from '@/src/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <Select
      value={locale}
      onValueChange={(value: string) => void setLocale(value as Locale)}
    >
      <SelectTrigger className="w-[130px] h-9" aria-label={t('locale.label')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="fr">{t('locale.fr')}</SelectItem>
        <SelectItem value="en">{t('locale.en')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
