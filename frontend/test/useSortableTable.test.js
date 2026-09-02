import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSortableTable } from '../src/hooks/useSortableTable';

const rows = [
  { nome: 'Charlie' },
  { nome: 'Alice' },
  { nome: 'Bob' },
];

describe('useSortableTable', () => {
  it('retorna as linhas na ordem original quando nenhum campo foi ordenado', () => {
    const { result } = renderHook(() => useSortableTable(rows));
    expect(result.current.sortedRows).toEqual(rows);
    expect(result.current.sortField).toBeNull();
  });

  it('ordena ascendente na primeira chamada de handleSort', () => {
    const { result } = renderHook(() => useSortableTable(rows));
    act(() => result.current.handleSort('nome'));
    expect(result.current.sortField).toBe('nome');
    expect(result.current.sortDir).toBe('asc');
    expect(result.current.sortedRows.map(r => r.nome)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('inverte a direção ao chamar handleSort de novo no mesmo campo', () => {
    const { result } = renderHook(() => useSortableTable(rows));
    act(() => result.current.handleSort('nome'));
    act(() => result.current.handleSort('nome'));
    expect(result.current.sortDir).toBe('desc');
    expect(result.current.sortedRows.map(r => r.nome)).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('reinicia para ascendente ao trocar de campo', () => {
    const { result } = renderHook(() => useSortableTable([
      { nome: 'Bob', idade: '30' },
      { nome: 'Alice', idade: '25' },
    ]));
    act(() => result.current.handleSort('nome'));
    act(() => result.current.handleSort('idade'));
    expect(result.current.sortField).toBe('idade');
    expect(result.current.sortDir).toBe('asc');
  });

  it('trata valores ausentes como string vazia sem quebrar', () => {
    const { result } = renderHook(() => useSortableTable([{ nome: 'Bob' }, { nome: null }]));
    act(() => result.current.handleSort('nome'));
    expect(result.current.sortedRows.map(r => r.nome)).toEqual([null, 'Bob']);
  });
});
