GRANT USAGE ON SCHEMA public TO appuser;

GRANT ALL PRIVILEGES ON TABLE tickets TO appuser;
GRANT ALL PRIVILEGES ON TABLE ticket_attachments TO appuser;
GRANT ALL PRIVILEGES ON TABLE ticket_messages TO appuser;
GRANT ALL PRIVILEGES ON TABLE tasks TO appuser;
GRANT ALL PRIVILEGES ON TABLE contacts TO appuser;

GRANT ALL PRIVILEGES ON SEQUENCE tickets_id_seq TO appuser;
GRANT ALL PRIVILEGES ON SEQUENCE ticket_attachments_id_seq TO appuser;
GRANT ALL PRIVILEGES ON SEQUENCE ticket_messages_id_seq TO appuser;
GRANT ALL PRIVILEGES ON SEQUENCE tasks_id_seq TO appuser;