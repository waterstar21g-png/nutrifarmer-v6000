CREATE TABLE IF NOT EXISTS v5000_post_actions (
  id serial PRIMARY KEY,
  post_id integer NOT NULL REFERENCES v5000_posts(id) ON DELETE CASCADE,
  actor_user_id integer NOT NULL REFERENCES v5000_users(id) ON DELETE CASCADE,
  author_user_id integer NOT NULL REFERENCES v5000_users(id) ON DELETE CASCADE,
  action varchar(20) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS v5000_post_actions_post_id_idx ON v5000_post_actions(post_id);
CREATE INDEX IF NOT EXISTS v5000_post_actions_actor_user_id_idx ON v5000_post_actions(actor_user_id);
