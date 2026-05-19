-- Cities
INSERT INTO cities (name, slug, state, display_order) VALUES
  ('Mohali', 'mohali', 'Punjab', 1),
  ('Chandigarh', 'chandigarh', 'Chandigarh', 2),
  ('Bangalore', 'bangalore', 'Karnataka', 3),
  ('Pune', 'pune', 'Maharashtra', 4),
  ('Mumbai', 'mumbai', 'Maharashtra', 5),
  ('Delhi', 'delhi', 'Delhi', 6),
  ('Gurgaon', 'gurgaon', 'Haryana', 7),
  ('Noida', 'noida', 'Uttar Pradesh', 8),
  ('Hyderabad', 'hyderabad', 'Telangana', 9),
  ('Chennai', 'chennai', 'Tamil Nadu', 10),
  ('Kolkata', 'kolkata', 'West Bengal', 11),
  ('Ahmedabad', 'ahmedabad', 'Gujarat', 12),
  ('Jaipur', 'jaipur', 'Rajasthan', 13),
  ('Kochi', 'kochi', 'Kerala', 14),
  ('Indore', 'indore', 'Madhya Pradesh', 15)
ON CONFLICT (slug) DO NOTHING;

-- Starter communities (Mohali launch)
INSERT INTO communities (slug, name, description, icon, type, city_id) VALUES
  ('mohali-professionals', 'Mohali Professionals',
    'The main hangout for working folks in Mohali. Memes, weekend plans, honest chats.',
    'Users', 'city', (SELECT id FROM cities WHERE slug = 'mohali')),
  ('tricity-tech', 'Tricity Tech',
    'Tech people in Mohali, Chandigarh, Panchkula. Code, careers, chai.',
    'Code', 'interest', (SELECT id FROM cities WHERE slug = 'mohali')),
  ('weekend-trekkers-tricity', 'Weekend Trekkers',
    'Plan treks, share trails, find your trekking gang.',
    'Mountain', 'interest', (SELECT id FROM cities WHERE slug = 'mohali')),
  ('cafe-hoppers-tricity', 'Cafe Hoppers',
    'Best cafes in Tricity. Plan meetups, work-from-cafe days.',
    'Coffee', 'interest', (SELECT id FROM cities WHERE slug = 'mohali')),
  ('burnout-club', 'Burnout Club',
    'Honest chats about work stress. No judgment, just real talk.',
    'Flame', 'interest', NULL),
  ('friday-night-plans', 'Friday Night Plans',
    'Drop your Friday plans. Find a movie buddy, dinner crew, gym partner.',
    'Moon', 'interest', NULL)
ON CONFLICT (slug) DO NOTHING;
