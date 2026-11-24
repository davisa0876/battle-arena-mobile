import i18n, { currentAppLanguage } from '@/src/i18n';

function formatNumber(value: number, fractionDigits: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Formats a height stored in centimeters as localized meters (unit label comes from i18n). */
export function formatHeight(value: number | null, fallback: string, locale: string = currentAppLanguage()): string {
  if (value == null) {
    return fallback;
  }

  return i18n.t('creatures.units.meters', { value: formatNumber(value / 100, 2, locale) });
}

/** Formats a weight stored in grams as localized kilograms (unit label comes from i18n). */
export function formatWeight(value: number | null, fallback: string, locale: string = currentAppLanguage()): string {
  if (value == null) {
    return fallback;
  }

  return i18n.t('creatures.units.kilograms', { value: formatNumber(value / 1000, 1, locale) });
}
