-- Sample reminders for a consultant's working day.
insert into public.reminders (title, description, time, recurrence, days_of_week, active) values
  ('Check email & Teams',          'Scan inbox and Teams channels for anything urgent before the day starts.', '08:30', 'weekdays', '{}', true),
  ('Daily stand-up',               'Join the client stand-up. Prepare: yesterday, today, blockers.',          '09:15', 'weekdays', '{}', true),
  ('Lunch break',                  'Step away from the screen and eat something.',                             '12:00', 'daily',    '{}', true),
  ('Stretch & drink water',        'Short break: stand up, stretch, refill your water bottle.',                '14:30', 'weekdays', '{}', true),
  ('Update task board',            'Move tickets in Jira/Azure DevOps and add comments on progress.',          '15:30', 'weekdays', '{}', true),
  ('Time reporting in BLIKK',      'Report today''s hours in BLIKK per project and activity.',                 '16:30', 'weekdays', '{}', true),
  ('Plan tomorrow',                'Write down the top 3 priorities for tomorrow.',                            '16:45', 'weekdays', '{}', true),
  ('Submit weekly expenses',       'Upload receipts and submit expenses/travel for the week.',                 '15:00', 'custom',   '{5}', true),
  ('Weekly status to client',      'Send a short status update: done, next, risks.',                           '14:00', 'custom',   '{5}', false);
