import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://zfcpkpmtrsqiuxvkhtbd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmY3BrcG10cnNxaXV4dmtodGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODUwODYsImV4cCI6MjA5NjM2MTA4Nn0.ZjPnnx_ubQwJGS32PMi5hmkjoHmOopjBG38prWIuJHk'
)