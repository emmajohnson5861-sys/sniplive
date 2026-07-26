'use client';

import { useEffect } from 'react';
import { initAuthListener } from '@/store/auth-store';

// Start auth listener immediately when this module loads (before any component mounts)
// This is called once globally so auth state is available ASAP across all pages
initAuthListener();

export default function AuthInitializer() {
  // No-op — the real work is done at module load above
  return null;
}
