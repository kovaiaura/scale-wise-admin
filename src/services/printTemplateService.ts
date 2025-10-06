import { PrintTemplate, DEFAULT_TEMPLATE } from '@/types/printTemplate';

const STORAGE_KEY = 'weighbridge_print_template';

export const printTemplateService = {
  saveTemplate: (template: PrintTemplate): void => {
    template.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
  },

  loadTemplate: (): PrintTemplate => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse stored template:', error);
        return DEFAULT_TEMPLATE;
      }
    }
    return DEFAULT_TEMPLATE;
  },

  resetTemplate: (): PrintTemplate => {
    localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_TEMPLATE;
  },
};
