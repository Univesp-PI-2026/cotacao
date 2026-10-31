CREATE TABLE quotation_auto (
  quotation_id BIGINT UNSIGNED NOT NULL,
  insurance_type TINYINT UNSIGNED NOT NULL,
  bonus_class VARCHAR(255) NULL,
  has_claims TINYINT(1) NULL,
  vehicle_plate VARCHAR(10) NOT NULL,
  vehicle_chassis VARCHAR(50) NOT NULL,
  vehicle_brand VARCHAR(255) NOT NULL,
  vehicle_model VARCHAR(255) NOT NULL,
  manufacture_year YEAR NOT NULL,
  overnight_zipcode VARCHAR(8) NOT NULL,
  driver_age TINYINT UNSIGNED NOT NULL,
  license_time VARCHAR(255) NOT NULL,
  coverages JSON NULL,
  has_insurer_preference TINYINT(1) NOT NULL DEFAULT 0,
  preferred_insurer VARCHAR(255) NULL,
  PRIMARY KEY (quotation_id),
  CONSTRAINT fk_quotation_auto_quotation FOREIGN KEY (quotation_id)
    REFERENCES quotations (id) ON DELETE CASCADE,
  CONSTRAINT ck_quotation_auto_insurance_type CHECK (insurance_type IN (0, 1))
);

CREATE TABLE quotation_home (
  quotation_id BIGINT UNSIGNED NOT NULL,
  insurance_type TINYINT UNSIGNED NOT NULL,
  has_claims TINYINT(1) NULL,
  coverages JSON NULL,
  has_insurer_preference TINYINT(1) NOT NULL DEFAULT 0,
  preferred_insurer VARCHAR(255) NULL,
  property_zipcode VARCHAR(8) NOT NULL,
  property_street VARCHAR(255) NOT NULL,
  property_number VARCHAR(30) NOT NULL,
  property_complement VARCHAR(255) NULL,
  property_district VARCHAR(120) NOT NULL,
  property_city VARCHAR(120) NOT NULL,
  property_state CHAR(2) NOT NULL,
  PRIMARY KEY (quotation_id),
  CONSTRAINT fk_quotation_home_quotation FOREIGN KEY (quotation_id)
    REFERENCES quotations (id) ON DELETE CASCADE,
  CONSTRAINT ck_quotation_home_insurance_type CHECK (insurance_type IN (0, 1))
);

CREATE TABLE quotation_credit_card (
  quotation_id BIGINT UNSIGNED NOT NULL,
  monthly_income DECIMAL(13,2) NOT NULL,
  occupation VARCHAR(255) NOT NULL,
  PRIMARY KEY (quotation_id),
  CONSTRAINT fk_quotation_credit_card_quotation FOREIGN KEY (quotation_id)
    REFERENCES quotations (id) ON DELETE CASCADE,
  CONSTRAINT ck_quotation_credit_card_income CHECK (monthly_income > 0),
  CONSTRAINT ck_quotation_credit_card_occupation CHECK (CHAR_LENGTH(TRIM(occupation)) > 0)
);

-- Reinicia os cadastros de cotação para a estrutura com detalhes por produto.
DELETE FROM quotations;

ALTER TABLE quotations
  MODIFY COLUMN product ENUM('auto', 'home', 'credit_card') NOT NULL DEFAULT 'auto',
  ADD KEY idx_quotations_product_active (product, active),
  DROP COLUMN insurance_type,
  DROP COLUMN bonus_class,
  DROP COLUMN has_claims,
  DROP COLUMN vehicle_plate,
  DROP COLUMN vehicle_chassis,
  DROP COLUMN vehicle_brand,
  DROP COLUMN vehicle_model,
  DROP COLUMN manufacture_year,
  DROP COLUMN overnight_zipcode,
  DROP COLUMN driver_age,
  DROP COLUMN license_time,
  DROP COLUMN coverages,
  DROP COLUMN has_insurer_preference,
  DROP COLUMN preferred_insurer,
  DROP COLUMN property_zipcode,
  DROP COLUMN property_street,
  DROP COLUMN property_number,
  DROP COLUMN property_complement,
  DROP COLUMN property_district,
  DROP COLUMN property_city,
  DROP COLUMN property_state,
  DROP COLUMN monthly_income,
  DROP COLUMN occupation;
