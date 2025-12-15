import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qzbkbldzsrimkliynltd.supabase.co";
const supabaseKey = "sb_publishable_81IEHNlkB4MLost9xspSzg_9rbXagLS";

export const supabase = createClient(supabaseUrl, supabaseKey);
