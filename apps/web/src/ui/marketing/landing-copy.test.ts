import { describe, expect, it } from 'vitest';
import { getLandingCopy } from './landing-copy';

describe('landing copy locales', () => {
  it('serves French copy for the French route', () => {
    const copy = getLandingCopy('fr');

    expect(copy.hero.titleStart).toContain('Votre site');
    expect(copy.navigation.apply).toBe('Demander un accès anticipé');
    expect(copy.seo.title).toContain('Site web & réservation');
  });

  it('serves English copy for the English route', () => {
    const copy = getLandingCopy('en');

    expect(copy.hero.titleStart).toContain('Your website');
    expect(copy.navigation.apply).toBe('Apply for early access');
    expect(copy.seo.title).toContain('Website & Booking Platform');
  });

  it('keeps qualification values stable across translated labels', () => {
    const englishValues = getLandingCopy('en').waitlist.contact.businessTypeOptions.map(
      (option) => option.value
    );
    const frenchValues = getLandingCopy('fr').waitlist.contact.businessTypeOptions.map(
      (option) => option.value
    );

    expect(frenchValues).toEqual(englishValues);
  });
});
