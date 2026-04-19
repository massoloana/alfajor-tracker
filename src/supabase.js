import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zcdcrxdabedyxhppyufa.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjZGNyeGRhYmVkeXhocHB5dWZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NjE0NjUsImV4cCI6MjA5MjEzNzQ2NX0.oKW0HDoVz_cwoXuEkbVFJNyPKDz-1e9jWnI1oyjKJ8E'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
