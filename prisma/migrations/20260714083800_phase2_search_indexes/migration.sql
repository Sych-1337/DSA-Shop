-- Phase 2 search support
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE INDEX IF NOT EXISTS products_search_text_trgm_idx
  ON products USING gin ("searchText" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS products_title_trgm_idx
  ON products USING gin (title gin_trgm_ops);
