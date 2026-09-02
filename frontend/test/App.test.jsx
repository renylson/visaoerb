import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    );
  });

  it('renderiza a rota raiz (Visão ERB) sem quebrar', async () => {
    render(<App />);
    expect(await screen.findByText('Consulte um site')).toBeInTheDocument();
    expect(screen.getAllByText('Visão ERB').length).toBeGreaterThan(0);
  });

  it('renderiza a sidebar com os itens de navegação principais', async () => {
    render(<App />);
    expect(await screen.findByText('Topologia')).toBeInTheDocument();
    expect(screen.getByText('Equipamentos')).toBeInTheDocument();
    expect(screen.getByText('Relatórios')).toBeInTheDocument();
  });
});
