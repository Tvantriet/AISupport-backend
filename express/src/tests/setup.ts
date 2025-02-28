// This file can be used to set up global test configurations
// For example, you might want to mock global fetch
import { afterEach, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Clean up after tests
afterEach(() => {
  vi.clearAllMocks();
}); 