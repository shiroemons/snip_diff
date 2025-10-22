import { describe, expect, it } from 'vitest';
import { SUPPORTED_LANGUAGES } from './constants';

describe('constants', () => {
  describe('SUPPORTED_LANGUAGES', () => {
    it('should be an array', () => {
      expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true);
    });

    it('should have at least one language', () => {
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(0);
    });

    it('should have Plain Text as the first language', () => {
      expect(SUPPORTED_LANGUAGES[0]).toEqual({
        value: 'plaintext',
        label: 'Plain Text',
      });
    });

    it('should have all required properties (value and label)', () => {
      SUPPORTED_LANGUAGES.forEach((lang) => {
        expect(lang).toHaveProperty('value');
        expect(lang).toHaveProperty('label');
        expect(typeof lang.value).toBe('string');
        expect(typeof lang.label).toBe('string');
      });
    });

    it('should have unique values', () => {
      const values = SUPPORTED_LANGUAGES.map((lang) => lang.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should include common programming languages', () => {
      const values = SUPPORTED_LANGUAGES.map((lang) => lang.value);
      expect(values).toContain('javascript');
      expect(values).toContain('typescript');
      expect(values).toContain('python');
      expect(values).toContain('java');
      expect(values).toContain('go');
      expect(values).toContain('rust');
    });

    it('should include markup languages', () => {
      const values = SUPPORTED_LANGUAGES.map((lang) => lang.value);
      expect(values).toContain('html');
      expect(values).toContain('css');
      expect(values).toContain('markdown');
      expect(values).toContain('json');
      expect(values).toContain('yaml');
    });

    it('should have correct count of languages', () => {
      // 現在23言語がサポートされている
      expect(SUPPORTED_LANGUAGES).toHaveLength(23);
    });
  });
});
