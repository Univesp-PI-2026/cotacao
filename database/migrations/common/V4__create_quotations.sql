CREATE TABLE IF NOT EXISTS quotations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id BIGINT UNSIGNED NOT NULL,
  request_date DATE NOT NULL,
  insurance_type TINYINT UNSIGNED NOT NULL COMMENT '0=novo, 1=renovacao',
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
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_quotations_customer_id (customer_id),
  KEY idx_quotations_active (active),
  CONSTRAINT fk_quotations_customer_id
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);
