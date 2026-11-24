-- Spot and Perps have separate Partner ID namespaces.
DROP INDEX IF EXISTS portal_partner_id_unique;
CREATE UNIQUE INDEX portal_partner_id_unique ON portal_setup_requests (product, lower(partner_id));
