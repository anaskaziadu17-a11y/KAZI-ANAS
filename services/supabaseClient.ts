import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sejvtrbkzpsmmvjxgger.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlanZ0cmJrenBzbW12anhnZ2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTIzNDcsImV4cCI6MjA4MTM4ODM0N30.Zk0X2keh_fjkgszxzvGrY_I2gLPHh-Uo2O5TjjfEZfc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);