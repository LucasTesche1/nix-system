import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

let clientToken: string | null = null;

export const setApiContextToken = (token: string | null) => {
  clientToken = token;
};

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
  },
  global: {
    fetch: (input: RequestInfo | URL, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (clientToken) {
        headers.set("x-client-token", clientToken);
      }
      return fetch(input, { ...init, headers });
    },
  },
});
