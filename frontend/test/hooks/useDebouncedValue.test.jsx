import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from '../../src/hooks/useDebouncedValue.js';

const DELAY_MS = 300;

function renderDebounced(initialValue) {
  return renderHook(({ value }) => useDebouncedValue(value, DELAY_MS), {
    initialProps: { value: initialValue },
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('devuelve el valor inicial sin esperar', () => {
    vi.useFakeTimers();

    const { result } = renderDebounced('');

    expect(result.current).toBe('');
  });

  it('no aplica el cambio hasta que pasa el retardo', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderDebounced('');

    rerender({ value: 'int' });
    act(() => vi.advanceTimersByTime(DELAY_MS - 1));

    expect(result.current).toBe('');
  });

  it('aplica el último valor al cumplirse el retardo', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderDebounced('');

    rerender({ value: 'inte' });
    rerender({ value: 'integrales' });
    act(() => vi.advanceTimersByTime(DELAY_MS));

    expect(result.current).toBe('integrales');
  });

  it('reinicia el retardo con cada cambio', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderDebounced('');

    rerender({ value: 'repaso' });
    act(() => vi.advanceTimersByTime(DELAY_MS - 100));
    rerender({ value: 'repaso de integrales' });
    act(() => vi.advanceTimersByTime(DELAY_MS - 100));

    expect(result.current).toBe('');

    act(() => vi.advanceTimersByTime(100));

    expect(result.current).toBe('repaso de integrales');
  });
});
