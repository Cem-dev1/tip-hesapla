import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hcerimsifyyoaeefxtfx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZXJpbXNpZnl5b2FlZWZ4dGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzY4OTcsImV4cCI6MjA4MzY1Mjg5N30.86u4VaiDQbEI9CJ5RqPsupwb5HLW2ayuolXsz6XB778'

export const supabase = createClient(supabaseUrl, supabaseKey)