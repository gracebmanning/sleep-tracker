do $$
declare uid uuid := (select id from auth.users limit 1);
begin
  insert into substances (user_id, name, unit) values
    (uid, 'Caffeine', 'mg'), (uid, 'Alcohol', 'standard_drinks'), (uid, 'Ibuprofen', 'mg');

  insert into event_types (user_id, name, duration_mode) values
    (uid, 'Headache', 'ended_button'),
    (uid, 'Sleep attack', 'ended_button'),
    (uid, 'Sleep paralysis (hypnagogic)', 'duration_chips'),
    (uid, 'Sleep paralysis (hypnopompic)', 'duration_chips');

  insert into sleep_aids (user_id, name) values
    (uid, 'YouTube video'), (uid, 'Rainforest sounds'), (uid, 'Rain sounds'),
    (uid, '"Chill" Spotify playlist'), (uid, 'None');

  insert into pre_bed_activities (user_id, name, examples)
  select (select id from auth.users limit 1), v.name, v.examples
  from (values
    ('Analog Wind Down', 'Reading a physical book, stretching, organizing'),
    ('Chill YouTube Time', 'Watching YouTube and eating / getting ready for bed'),
    ('Intentional Media', 'Sitting down to watch a specific movie, long-form video, or TV show'),
    ('Mindless Scrolling', 'Reels, Shorts, etc.'),
    ('Nighttime Computer Work', 'Coding, admin, emails'),
    ('Socialization - Low Energy', 'Board games, hanging at a friend''s house'),
    ('Socialization - Medium Energy', 'Playing darts at a dive bar'),
    ('Socialization - High Energy', 'Dancing at a club'),
    ('Other - Low Energy', null),
    ('Other - Medium Energy', null),
    ('Other - High Energy', null)
  ) as v(name, examples);

  insert into consumption_items (user_id, substance_id, name, default_amount, volume_ml, abv_percent, is_favorite)
  select uid, s.id, v.name, coalesce(v.amt, 1), v.vol, v.abv, v.fav
  from (values
    ('Ibuprofen', 'Ibuprofen 400 mg', 400, null, null, true),
    ('Ibuprofen', 'Ibuprofen 200 mg', 200, null, null, false),
    ('Caffeine', '6 oz instant coffee', 98, null, null, true),
    ('Caffeine', '8 oz instant coffee', 130, null, null, false),
    ('Caffeine', '10 oz K-cup', 100, null, null, false),
    ('Caffeine', '8 oz home brew', 95, null, null, true),
    ('Caffeine', '6 oz chai latte', 60, null, null, false),
    ('Caffeine', '11.5 oz Yerba Mate (enlightenmint)', 115, null, null, false),
    ('Alcohol', 'Beer (12 oz, 5%)', null, 355, 5, false),
    ('Alcohol', 'Hard seltzer (12 oz, 5%)', null, 355, 5, false),
    ('Alcohol', 'Wine (5 oz, 12%)', null, 148, 12, false),
    ('Alcohol', 'Shot (1.5 oz, 40%)', null, 44, 40, false),
    ('Alcohol', 'Other alcohol', 1, null, null, false)
  ) as v(substance, name, amt, vol, abv, fav)
  join substances s on s.user_id = uid and s.name = v.substance;
end $$;