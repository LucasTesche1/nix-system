import { supabase, setApiContextToken } from "./supabase";
import { Database } from "@/integrations/supabase/types";

export const api = {
  setClientToken: (token: string | null) => {
    setApiContextToken(token);
  },
  from: <T extends keyof Database["public"]["Tables"]>(table: T) => {
    return supabase.from(table);
  },
};
