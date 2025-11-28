// Global test setup
// Mock the transformers library to avoid ES module issues in Jest
import { jest } from '@jest/globals';

jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(() =>
    Promise.resolve(jest.fn(() =>
      Promise.resolve({
        data: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5])
      })
    ))
  ),
}));