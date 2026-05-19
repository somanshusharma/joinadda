-- v2 — Anonymous posts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_anonymous') THEN
    ALTER TABLE posts ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'anonymous_handle') THEN
    ALTER TABLE posts ADD COLUMN anonymous_handle TEXT;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION generate_anonymous_handle()
RETURNS TEXT AS $$
DECLARE
  adjectives TEXT[] := ARRAY[
    'Tired', 'Caffeinated', 'Hopeful', 'Sleepy', 'Curious',
    'Burnt-out', 'Excited', 'Confused', 'Hangry', 'Chill'
  ];
  animals TEXT[] := ARRAY[
    'Cat', 'Panda', 'Fox', 'Owl', 'Rabbit',
    'Tiger', 'Penguin', 'Squirrel', 'Hedgehog', 'Otter'
  ];
BEGIN
  RETURN adjectives[1 + floor(random() * 10)::int] || ' ' ||
         animals[1 + floor(random() * 10)::int];
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_anonymous_handle()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_anonymous = true AND NEW.anonymous_handle IS NULL THEN
    NEW.anonymous_handle = generate_anonymous_handle();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_anonymous_post') THEN
    CREATE TRIGGER on_anonymous_post BEFORE INSERT ON posts
      FOR EACH ROW EXECUTE FUNCTION set_anonymous_handle();
  END IF;
END $$;
