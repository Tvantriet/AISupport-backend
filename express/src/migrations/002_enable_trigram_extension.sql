-- Enable the pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Better index for fuzzy search
DROP INDEX IF EXISTS idx_products_name;
DROP INDEX IF EXISTS idx_products_description;

-- Create GIN indexes for trigram similarity search
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_description_trgm ON products USING gin (description gin_trgm_ops); 