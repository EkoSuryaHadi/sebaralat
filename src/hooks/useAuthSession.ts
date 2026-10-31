'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  mapMemberFromDb,
  ShopMemberDbRow,
} from '@/lib/supabase';
import { Role, ShopMember } from '@/types';

export function useAuthSession(activeShopSlug?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<ShopMember[]>([]);
  const [authLoading, setAuthLoading] = useState<boolean>(isSupabaseConfigured);
  // Hanya tersedia pada mode pengembangan lokal ketika Supabase tidak dikonfigurasi
  const [devSimulatedRole, setDevSimulatedRole] = useState<Role>('customer');

  const fetchMemberships = useCallback(async (uid: string): Promise<ShopMember[]> => {
    if (!supabase) return [];
    try {
      // Klaim undangan staf yang tertunda berdasarkan email user yang login
      await supabase.rpc('claim_my_invites');

      const { data, error } = await supabase
        .from('shop_members')
        .select('shop_slug, user_id, email, role, created_at')
        .eq('user_id', uid);

      if (!error && data) {
        const mapped = (data as ShopMemberDbRow[]).map(mapMemberFromDb);
        setMemberships(mapped);
        return mapped;
      }
    } catch (err) {
      console.error('Gagal mengambil data keanggotaan toko:', err);
    }
    return [];
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    const client = supabase;

    client.auth.getSession().then(({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchMemberships(currentUser.id).finally(() => setAuthLoading(false));
      } else {
        setAuthLoading(false);
      }
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        setAuthLoading(true);
        fetchMemberships(nextUser.id).finally(() => setAuthLoading(false));
      } else {
        setMemberships([]);
        setAuthLoading(false);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [fetchMemberships]);

  // Role diturunkan dari tabel shop_members jika terautentikasi riil; jika tidak ada (seperti mode demo/offline), gunakan peran simulasi devSimulatedRole
  const activeMembership = activeShopSlug
    ? memberships.find((m) => m.shopSlug === activeShopSlug)
    : undefined;
  const currentRole: Role =
    activeMembership?.role ?? devSimulatedRole;

  const sendEmailOtp = async (
    email: string,
    redirectPath?: string
  ): Promise<{ error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: 'Masukkan alamat email yang valid.' };
    }
    if (!supabase) {
      return {
        error:
          'Supabase belum dikonfigurasi pada environment ini. Gunakan mode pratinjau lokal atau atur NEXT_PUBLIC_SUPABASE_URL.',
      };
    }
    const targetPath = redirectPath || (activeShopSlug ? `/${activeShopSlug}` : '/login');
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`
        : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });
    if (error) {
      return { error: error.message };
    }
    return {};
  };

  const verifyEmailOtp = async (
    email: string,
    token: string
  ): Promise<{ error?: string; memberships?: ShopMember[] }> => {
    if (!supabase) {
      return { error: 'Supabase belum dikonfigurasi.' };
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();
    if (!cleanToken) {
      return { error: 'Masukkan kode OTP 6 digit dari email Anda.' };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'email',
    });

    if (error) {
      return { error: error.message };
    }
    if (data.user) {
      setUser(data.user);
      const list = await fetchMemberships(data.user.id);
      return { memberships: list };
    }
    return {};
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setMemberships([]);
    setDevSimulatedRole('customer');
  };

  return {
    user,
    memberships,
    currentRole,
    authLoading,
    sendEmailOtp,
    verifyEmailOtp,
    signOut,
    refreshMemberships: () => (user ? fetchMemberships(user.id) : Promise.resolve([])),
    setDevSimulatedRole,
  };
}
