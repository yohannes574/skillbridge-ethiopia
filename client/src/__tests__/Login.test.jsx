import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Login from '../pages/auth/Login';

describe('Login Page & 1-Click Demo Access', () => {
  it('renders login form and all 4 1-Click Demo role buttons', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthProvider>
    );

    // Form check
    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeDefined();
    expect(screen.getByText('Email Address')).toBeDefined();
    expect(screen.getByText('Password')).toBeDefined();

    // 1-Click Demo Access check
    expect(screen.getByText('Quick Demo Access (1-Click)')).toBeDefined();
    expect(screen.getByText('Student Demo')).toBeDefined();
    expect(screen.getByText('Mentor Demo')).toBeDefined();
    expect(screen.getByText('Employer Demo')).toBeDefined();
    expect(screen.getByText('Admin Demo')).toBeDefined();
  });
});
