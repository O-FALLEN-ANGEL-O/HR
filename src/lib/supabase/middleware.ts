import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/user';

// This function is no longer needed as we will simplify the middleware logic.
// The new middleware will directly call the `getUser` function.
// export async function updateSession(request: NextRequest) { ... }

// We are keeping this file for the `middleware` export below,
// but the logic is now self-contained in the middleware function.
