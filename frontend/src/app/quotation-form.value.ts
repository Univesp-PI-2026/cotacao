export type QuotationFormValue = {
  customer_id: number;
  request_date: string;
  insurance_type: number;
  bonus_class: string;
  has_claims: boolean;
  vehicle_plate: string;
  vehicle_chassis: string;
  vehicle_brand: string;
  vehicle_model: string;
  manufacture_year: number | null;
  overnight_zipcode: string;
  driver_age: number | null;
  license_time: string;
  coverages: string;
  has_insurer_preference: boolean;
  preferred_insurer: string;
  active: boolean;
};
