CREATE ROLE lafabrica_app LOGIN PASSWORD '@Smgfortnite18';
GRANT CONNECT ON DATABASE "LaFabrica_Players" TO lafabrica_app;
GRANT USAGE ON SCHEMA public TO lafabrica_app;
GRANT SELECT, INSERT, UPDATE ON players TO lafabrica_app;
GRANT SELECT, INSERT, UPDATE ON scout_reports TO lafabrica_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lafabrica_app;