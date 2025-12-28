// Test setup file
import { beforeAll, afterAll, afterEach } from 'vitest';

// Setup before all tests
beforeAll(async () => {
  // Initialize test database connection if needed
  console.log('Setting up tests...');
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connections
  console.log('Cleaning up tests...');
});

// Reset mocks after each test
afterEach(() => {
  // Clear all mocks
});

// Global test utilities
global.testUtils = {
  generateMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'USER',
  }),
  
  generateMockToken: () => 'mock-jwt-token',
};
