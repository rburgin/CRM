import { vi } from 'vitest';

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  },
});

// Mock performance.now for consistent testing
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
});

// Mock navigator for user agent
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
  },
});