import '@testing-library/jest-dom';

// Mock TextEncoder/TextDecoder for Node environment if missing (common issue in Jest 27+)
import { TextEncoder, TextDecoder } from 'util';

declare const jest: any;

Object.assign(globalThis, { TextEncoder, TextDecoder });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});