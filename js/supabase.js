import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://iswtfxqsnybmtsmpwqhi.supabase.co';
const supabasePublishableKey = 'sb_publishable_8plXeuh8RmCtWv_fExFJ3A_r61hvscr';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
