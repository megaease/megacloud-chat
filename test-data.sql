-- Insert test data for artifact testing
INSERT INTO t_chats (id, title, user_id, created_at, updated_at) 
VALUES ('manual-test-chat-id', 'Manual Test Chat', 'test-user-id', NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;
