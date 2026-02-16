-- ============================================================================
-- POST-PRISMA MIGRATION: Constraints & Triggers
-- Run AFTER `npx prisma db push` to add constraints Prisma cannot express
-- ============================================================================

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 1. CHECK CONSTRAINTS for rating fields (min:1, max:5)                    │
-- └──────────────────────────────────────────────────────────────────────────┘

ALTER TABLE reviews
  ADD CONSTRAINT chk_review_rating CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE vendor_rating_reviews
  ADD CONSTRAINT chk_vendor_rating_review CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE delivery_person_ratings
  ADD CONSTRAINT chk_delivery_person_rating CHECK (rating >= 1 AND rating <= 5);


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 2. CHECK CONSTRAINT on Notification: exactly one FK must be non-null      │
-- └──────────────────────────────────────────────────────────────────────────┘

ALTER TABLE notifications
  ADD CONSTRAINT chk_notification_one_recipient CHECK (
    (CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END
   + CASE WHEN vendor_id IS NOT NULL THEN 1 ELSE 0 END
   + CASE WHEN delivery_person_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  );


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 3. Lowercase enforcement triggers (replaces Mongoose lowercase option)    │
-- └──────────────────────────────────────────────────────────────────────────┘

-- Admin email
CREATE OR REPLACE FUNCTION trg_admin_lowercase() RETURNS TRIGGER AS $$
BEGIN
  NEW.email := LOWER(TRIM(NEW.email));
  NEW.name := TRIM(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_before_upsert
  BEFORE INSERT OR UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION trg_admin_lowercase();

-- User email
CREATE OR REPLACE FUNCTION trg_user_lowercase() RETURNS TRIGGER AS $$
BEGIN
  NEW.email := LOWER(TRIM(NEW.email));
  NEW.name := TRIM(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_before_upsert
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trg_user_lowercase();

-- Vendor email
CREATE OR REPLACE FUNCTION trg_vendor_lowercase() RETURNS TRIGGER AS $$
BEGIN
  NEW.email := LOWER(TRIM(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_before_upsert
  BEFORE INSERT OR UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION trg_vendor_lowercase();

-- DeliveryPerson email
CREATE OR REPLACE FUNCTION trg_delivery_lowercase() RETURNS TRIGGER AS $$
BEGIN
  NEW.email := LOWER(TRIM(NEW.email));
  NEW.name := TRIM(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_before_upsert
  BEFORE INSERT OR UPDATE ON delivery_persons
  FOR EACH ROW EXECUTE FUNCTION trg_delivery_lowercase();


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 4. Uppercase enforcement for Offer.code                                   │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION trg_offer_uppercase_code() RETURNS TRIGGER AS $$
BEGIN
  NEW.code := UPPER(TRIM(NEW.code));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER offer_before_upsert
  BEFORE INSERT OR UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION trg_offer_uppercase_code();


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 5. Automatic delivery_person_cache TTL cleanup                            │
-- │    (replaces MongoDB's expireAfterSeconds TTL index)                       │
-- └──────────────────────────────────────────────────────────────────────────┘
-- Note: Also handled by PrismaCacheService @Cron, but this is a DB-level backup.

CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS void AS $$
BEGIN
  DELETE FROM delivery_person_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Use pg_cron extension if available (requires superuser)
-- SELECT cron.schedule('cleanup-delivery-cache', '*/30 * * * *', 'SELECT cleanup_expired_cache()');


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 6. GIN index on delivery_person_cache.cached_orders for JSONB queries     │
-- └──────────────────────────────────────────────────────────────────────────┘

CREATE INDEX IF NOT EXISTS idx_delivery_cache_orders_gin
  ON delivery_person_cache USING GIN (cached_orders);


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ 7. Enable pg_trgm for text search (replaces MongoDB regex queries)        │
-- └──────────────────────────────────────────────────────────────────────────┘

-- Uncomment if pg_trgm extension is available:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_user_name_trgm ON users USING GIN (name gin_trgm_ops);
-- CREATE INDEX idx_vendor_shop_name_trgm ON vendors USING GIN (shop_name gin_trgm_ops);
-- CREATE INDEX idx_order_notes_trgm ON orders USING GIN (order_notes gin_trgm_ops);
