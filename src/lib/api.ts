import { supabase } from "./supabase";
import { Database } from "@/integrations/supabase/types";

export const api = {
  from: <T extends keyof Database["public"]["Tables"]>(table: T) => {
    return supabase.from(table);
  },
};
