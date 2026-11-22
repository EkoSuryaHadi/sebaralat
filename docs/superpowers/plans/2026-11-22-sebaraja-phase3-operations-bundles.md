# Sebaraja Phase 3 (Lead Alert, Handover/DP, Walk-in, QRIS & Bundling) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 4 Phase 3 operational & conversion features for Sebaraja: (1) Real-time Telegram Lead Alert to shop owners on new bookings, (2) Pickup Time, Delivery Mode, Payment Status/DP & Collateral tracking across Checkout, Workspace, and Receipt, (3) Fast Walk-in Rental recording (`create_walkin_booking`), and (4) Shop QRIS upload + Physical-Stock-Linked Rental Bundles (`bundles JSONB`).

**Architecture:** Migration `0008_phase3_operations_bundles.sql` extends `shops` (`qris_url`, `bundles`, `notify_telegram_chat_id` kept private from `shops_public`) and `bookings` (`pickup_time`, `delivery_mode`, `payment_status`, `dp_amount`, `collateral`, `source`), and introduces server-validated RPCs (`create_walkin_booking`, `update_booking_handover`, `get_booking_notify_payload`, and bundle-aware `create_booking`). Pure bundle stock calculation and cart/checkout logic live in `src/lib/validators.ts`, Telegram formatting in `src/lib/telegram.ts`, and modular UI in `WaPreviewModal.tsx`, `BookingStatusModal.tsx`, `WalkInBookingModal.tsx`, `CatalogView.tsx`, `WorkspaceView.tsx`, and `AppShell.tsx`.

**Spec:** [2026-11-22-sebaraja-phase3-operations-bundles-design.md](file:///e:/Project/sebaralat/docs/superpowers/specs/2026-11-22-sebaraja-phase3-operations-bundles-design.md)

## Global Constraints

- Keep `shops.notify_telegram_chat_id` private (excluded from `shops_public` and anonymous catalog queries).
- Bundle stock is always computed from constituent `rental_items` availability (`min(floor(avail / qty))`) and deducted atomically in PostgreSQL `create_booking` / `create_walkin_booking`.
- Maintain 100% offline/demo fallback compatibility (`!supabase`).
- All tests (`npm test`), linter (`npm run lint`), and production build (`npm run build`) must pass with 0 errors.

---

### Task 1: Migration 0008, Types, Supabase Mappers & Bundle/Handover Validators

**Files:**
- Create: [supabase/migrations/0008_phase3_operations_bundles.sql](file:///e:/Project/sebaralat/supabase/migrations/0008_phase3_operations_bundles.sql)
- Modify: [supabase/schema.sql](file:///e:/Project/sebaralat/supabase/schema.sql)
- Modify: [src/types/index.ts](file:///e:/Project/sebaralat/src/types/index.ts)
- Modify: [src/lib/validators.ts](file:///e:/Project/sebaralat/src/lib/validators.ts)
- Modify: [src/lib/supabase.ts](file:///e:/Project/sebaralat/src/lib/supabase.ts)
- Modify: [src/data/mockData.ts](file:///e:/Project/sebaralat/src/data/mockData.ts)
- Test: [src/lib/__tests__/validators.test.ts](file:///e:/Project/sebaralat/src/lib/__tests__/validators.test.ts)

- [ ] **Step 1: Add unit tests for `computeBundleAvailability`, `calculateCartSummary` with bundles, `RentalBundleSchema`, and `BookingHandoverSchema` in `src/lib/__tests__/validators.test.ts`**
- [ ] **Step 2: Create `supabase/migrations/0008_phase3_operations_bundles.sql` and update `supabase/schema.sql`**
- [ ] **Step 3: Update `src/types/index.ts`, `src/lib/validators.ts`, `src/lib/supabase.ts`, and `src/data/mockData.ts`**
- [ ] **Step 4: Run `npm test` to verify Task 1 passes**

---

### Task 2: Real-Time Owner Lead Notifications (`telegram.ts` & `/api/notify`)

**Files:**
- Modify: [src/lib/telegram.ts](file:///e:/Project/sebaralat/src/lib/telegram.ts)
- Modify: [src/app/api/notify/route.ts](file:///e:/Project/sebaralat/src/app/api/notify/route.ts)
- Test: [src/lib/__tests__/telegram.test.ts](file:///e:/Project/sebaralat/src/lib/__tests__/telegram.test.ts)

- [ ] **Step 1: Add `booking_created` and `test_shop_notify` schemas + `formatBookingCreatedTelegramMessage` in `src/lib/telegram.ts` and test in `telegram.test.ts`**
- [ ] **Step 2: Implement server-side handlers for `booking_created` (reads shop's `notify_telegram_chat_id` via `get_booking_notify_payload` RPC) and `test_shop_notify` (Owner-verified) in `src/app/api/notify/route.ts`**
- [ ] **Step 3: Run `npm test` to verify Task 2 passes**

---

### Task 3: Hook `useShopData` — Bundles, Handover, Walk-in & Lead Notify

**Files:**
- Modify: [src/hooks/useShopData.ts](file:///e:/Project/sebaralat/src/hooks/useShopData.ts)

- [ ] **Step 1: Include `qris_url` and `bundles` in public `shops` select, and `notify_telegram_chat_id` in Owner workspace fetch**
- [ ] **Step 2: Update `createBookingOrder` to accept `pickupTime`, `deliveryMode`, `bundleCart`, and trigger non-blocking `booking_created` notification to `/api/notify`**
- [ ] **Step 3: Implement `updateBookingHandover`, `createWalkInBooking`, and `sendTestShopNotification` with full local/demo fallback**

---

### Task 4: Checkout & Receipt Upgrades (`WaPreviewModal.tsx` & `BookingStatusModal.tsx`)

**Files:**
- Modify: [src/components/WaPreviewModal.tsx](file:///e:/Project/sebaralat/src/components/WaPreviewModal.tsx)
- Modify: [src/components/BookingStatusModal.tsx](file:///e:/Project/sebaralat/src/components/BookingStatusModal.tsx)

- [ ] **Step 1: Add Pickup Time (`08:00`–`21:00`), Delivery Mode (`pickup` vs `delivery`), and collapsible Shop QRIS preview in `WaPreviewModal.tsx`**
- [ ] **Step 2: Display Pickup Time, Delivery Mode, Payment Status (`Belum Bayar` / `DP` / `Lunas`), Remaining Balance, Collateral, and Shop QRIS on the printable receipt in `BookingStatusModal.tsx`**

---

### Task 5: Walk-in Modal (`WalkInBookingModal.tsx`) & Catalog Bundle Section (`CatalogView.tsx`)

**Files:**
- Create: [src/components/WalkInBookingModal.tsx](file:///e:/Project/sebaralat/src/components/WalkInBookingModal.tsx)
- Modify: [src/components/CatalogView.tsx](file:///e:/Project/sebaralat/src/components/CatalogView.tsx)

- [ ] **Step 1: Create `src/components/WalkInBookingModal.tsx` for rapid walk-in rental entry (select items, duration, customer, payment status/DP, collateral)**
- [ ] **Step 2: Render the `"🎁 Paket Bundling Hemat"` section in `CatalogView.tsx` showing live bundle availability, constituent unit list, bundle pricing, and `+ Pilih Paket` / `+/-` cart controls**

---

### Task 6: Workspace Handover, QRIS/Telegram/Bundle Editors (`WorkspaceView.tsx`) & `AppShell.tsx` Wiring

**Files:**
- Modify: [src/components/WorkspaceView.tsx](file:///e:/Project/sebaralat/src/components/WorkspaceView.tsx)
- Modify: [src/components/AppShell.tsx](file:///e:/Project/sebaralat/src/components/AppShell.tsx)

- [ ] **Step 1: Add `"+ Catat Sewa Walk-in"` CTA in `WorkspaceView.tsx` (Inventory & Bookings tabs) and inline Handover editor (`paymentStatus`, `dpAmount`, `collateral`) on each Booking card**
- [ ] **Step 2: Add Shop QRIS uploader, Telegram Chat ID + `"Tes Kirim Notifikasi"`, and Bundle Builder (`RentalBundle`) in `WorkspaceView.tsx` Settings tab**
- [ ] **Step 3: Wire `bundleCart`, `pickupTime`, `deliveryMode`, `WalkInBookingModal`, and `BookingStatusModal` QRIS in `AppShell.tsx`**
- [ ] **Step 4: Run `npm test; if ($LASTEXITCODE -eq 0) { npm run lint }; if ($LASTEXITCODE -eq 0) { npm run build }` and verify 0 errors**
