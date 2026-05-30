import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Navbar from './Navbar';

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn()
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('Pruebas unitarias frontend - Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockReset();
  });

  it('muestra el enlace de acceso cuando no hay usuario', () => {
    render(
      <MemoryRouter>
        <Navbar user={null} setUser={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /entrar/i })).toBeInTheDocument();
  });

  it('muestra el acceso de administrador cuando el usuario tiene rol admin', () => {
    render(
      <MemoryRouter>
        <Navbar user={{ username: 'admin', role: 'admin' }} setUser={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
  });

  it('el logout limpia sesión y redirige al inicio', () => {
    localStorage.setItem('token', 'token-de-prueba');
    localStorage.setItem('role', 'admin');
    localStorage.setItem('username', 'admin');
    const setUser = vi.fn();

    render(
      <MemoryRouter>
        <Navbar user={{ username: 'admin', role: 'admin' }} setUser={setUser} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /salir/i }));

    expect(localStorage.getItem('token')).to.equal(null);
    expect(localStorage.getItem('role')).to.equal(null);
    expect(localStorage.getItem('username')).to.equal(null);
    expect(setUser).toHaveBeenCalledWith(null);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
