import React from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

it('opens recruiter verification without a recruiter login', async () => {
  window.location.hash = '#/recruteur/verifier';

  render(<App />);

  expect(await screen.findByRole('heading', { name: /V.rifier un dipl.me/i })).toBeTruthy();
  expect(screen.queryByText(/Connexion recruteur/i)).toBeNull();
});
