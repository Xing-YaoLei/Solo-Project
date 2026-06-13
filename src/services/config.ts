export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export const CONFIG = {
  USE_MOCK,
  DEFAULT_PAGE_SIZE: 10,
  ALLOWED_IMPORT_TYPES: ['INVENTORY', 'TRANSACTION', 'REVIEW'] as const,
};
