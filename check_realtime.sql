-- Check if posts table is in real-time publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- If posts is not listed, add it:
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- Also check if real-time is enabled at database level
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';
