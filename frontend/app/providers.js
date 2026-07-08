'use client';

import { AuthProvider } from '../components/AuthContext';

export function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
