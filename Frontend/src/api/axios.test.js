import { describe, it, expect } from 'vitest';
import api from './axios';

describe('axios interceptor tests', () => {
  it('exports an axios instance', () => {
    expect(api).toBeDefined();
    expect(api.interceptors.request).toBeDefined();
  });
});
