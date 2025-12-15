import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qzbkbldzsrimkliynltd.supabase.co';
// Nota: Em produção, chaves de API devem estar em variáveis de ambiente.
const supabaseKey = 'sb_publishable_81IEHNlkB4MLost9xspSzg_9rbXagLS';

export const supabase = createClient(supabaseUrl, supabaseKey);