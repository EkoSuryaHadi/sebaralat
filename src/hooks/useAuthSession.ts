'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  mapMemberFromDb,
  ShopMemberDbRow,
} from '@/lib/supabase';
import { resolveEffectiveRole } from '@/lib/validators';
import {
  detectNewlyClaimedMemberships,
  triggerTelegramClientAlert,
} from '@/lib/telegram';
import { Role, ShopMember } from '@/types';

export function useAuthSession(activeShopSlug?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<ShopMember[]>([]);
  const [authLoading, setAuthLoading] = useState<boolean>(isSupabaseConfigured);
  // Hanya tersedia pada mode pengembangan lokal ketika Supabase tidak dikonfigurasi
  const [devSimulatedRole, setDevSimulatedRole] = useState<Role>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.sessionStorage?.getItem('sebaraja_dev_role');
      if (stored === 'owner' || stored === 'staff') {
        return stored;
      }
    }
    return 'customer';
  });

  const inFlightMembershipRef = useRef<{
    uid: string;
    promise: Promise<ShopMember[]>;
  } | null>(null);

  const fetchMemberships = useCallback(async (uid: string): Promise<ShopMember[]> => {
    if (!supabase) return [];
    const client = supabase;

    if (inFlightMembershipRef.current?.uid === uid) {
      return inFlightMembershipRef.current.promise;
    }

    const task = (async (): Promise<ShopMember[]> => {
      try {
        // Ambil daftar toko yang sudah diikuti sebelum klaim undangan baru
        const { data: beforeData, error: beforeError } = await client
          .from('shop_members')
          .select('shop_slug')
          .eq('user_id', uid);

        const beforeSlugs = ((beforeData as { shop_slug: string }[] | null) ?? []).map(
          (row) => row.shop_slug
        );

        // Klaim undangan staf yang tertunda berdasarkan email user yang login
        await client.rpc('claim_my_invites');

        const { data, error } = await client
          .from('shop_members')
          .select('shop_slug, user_id, email, role, created_at')
          .eq('user_id', uid);

        if (!error && data) {
          const mapped = (data as ShopMemberDbRow[]).map(mapMemberFromDb);
          setMemberships(mapped);

          // Kirim notifikasi Telegram hanya jika ada undangan yang BARU diklaim saat ini
          if (!beforeError) {
            const newlyJoined = detectNewlyClaimedMemberships(beforeSlugs, mapped);
            if (newlyJoined.length > 0) {
              const { data: sessionData } = await client.auth.getSession();
              const accessToken = sessionData.session?.access_token;

              for (const joined of newlyJoined) {
                const storageKey = `sebaraja_notified_join:${uid}:${joined.shopSlug}`;
                const alreadySent =
                  typeof window !== 'undefined' &&
                  window.sessionStorage?.getItem(storageKey) === '1';

                if (!alreadySent) {
                  if (typeof window !== 'undefined') {
                    window.sessionStorage?.setItem(storageKey, '1');
                  }
                  void triggerTelegramClientAlert(
                    {
                      event: 'member_joined',
                      shopSlug: joined.shopSlug,
                      role: joined.role,
                      email: joined.email,
                    },
                    accessToken
                  );
                }
              }
            }
          }

          return mapped;
        }
      } catch (err) {
        console.error('Gagal mengambil data keanggotaan toko:', err);
      } finally {
        if (inFlightMembershipRef.current?.uid === uid) {
          inFlightMembershipRef.current = null;
        }
      }
      return [];
    })();

    inFlightMembershipRef.current = { uid, promise: task };
    return task;
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

  // Role diturunkan dari tabel shop_members jika terautentikasi riil;
  // P1-3: Pada produksi (Supabase aktif), devSimulatedRole hanya diizinkan pada toko demo showcase
  const activeMembership = activeShopSlug
    ? memberships.find((m) => m.shopSlug === activeShopSlug)
    : undefined;
  const currentRole: Role = resolveEffectiveRole({
    authenticatedRole: activeMembership?.role,
    devSimulatedRole,
    isSupabaseConfigured,
    activeShopSlug,
  });

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
