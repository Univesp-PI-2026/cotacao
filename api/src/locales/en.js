module.exports = {
  common: {
    invalid_data: "Invalid data",
    not_found: "Record not found",
    internal_server_error: "Internal server error"
  },
  auth: {
    token_missing: "Token not provided",
    token_invalid: "Invalid or expired token",
    login_required_fields: "identifier and password are required",
    invalid_credentials: "Invalid credentials",
    inactive_user: "Inactive user",
    login_failed: "Authentication failed"
  },
  customers: {
    not_found: "Customer not found",
    list_failed: "Failed to list customers",
    fetch_failed: "Failed to fetch customer",
    create_failed: "Failed to create customer",
    update_failed: "Failed to update customer",
    activate_failed: "Failed to activate customer",
    deactivate_failed: "Failed to deactivate customer",
    activated_success: "Customer activated successfully",
    deactivated_success: "Customer deactivated successfully",
    duplicate_unique_fields: "Email, CPF, or RNM already exists",
    validation: {
      name_required: "Name is required",
      email_required: "Email is required",
      email_invalid: "Email must be valid",
      is_foreign_invalid: "is_foreign must be boolean",
      birth_date_required: "Birth date is required",
      zip_code_required: "ZIP code is required",
      street_required: "Street is required",
      number_required: "Number is required",
      district_required: "District is required",
      city_required: "City is required",
      state_required: "State is required",
      cpf_required: "CPF is required when is_foreign is false",
      rnm_required: "RNM is required when is_foreign is true"
    }
  },
  users: {
    not_found: "User not found",
    list_failed: "Failed to list users",
    fetch_failed: "Failed to fetch user",
    create_failed: "Failed to create user",
    update_failed: "Failed to update user",
    activate_failed: "Failed to activate user",
    deactivate_failed: "Failed to deactivate user",
    activated_success: "User activated successfully",
    deactivated_success: "User deactivated successfully",
    duplicate_user_identity: "A user with this username or email already exists",
    invalid_role: "role_id is invalid",
    last_active_admin_required: "There must be at least one active admin",
    validation: {
      name_required: "Name is required",
      username_required: "Username is required",
      username_invalid: "Username must be 3 to 30 characters and use only letters, numbers, dot, dash, or underscore",
      email_required: "Email is required",
      email_invalid: "Email must be valid",
      role_required: "role_id is required",
      password_required: "Password is required",
      password_min_length: "Password must have at least 8 characters"
    }
  },
  roles: {
    not_found: "Role not found",
    list_failed: "Failed to list roles",
    fetch_failed: "Failed to fetch role",
    create_failed: "Failed to create role",
    update_failed: "Failed to update role",
    delete_failed: "Failed to delete role",
    deleted_success: "Role deleted successfully",
    duplicate_name: "A role with this name already exists",
    in_use: "Role is being used by users",
    validation: {
      name_required: "Role name is required"
    }
  },
  quotations: {
    not_found: "Quotation not found",
    list_failed: "Failed to list quotations",
    fetch_failed: "Failed to fetch quotation",
    create_failed: "Failed to create quotation",
    update_failed: "Failed to update quotation",
    activate_failed: "Failed to activate quotation",
    deactivate_failed: "Failed to deactivate quotation",
    activated_success: "Quotation activated successfully",
    deactivated_success: "Quotation deactivated successfully",
    invalid_customer: "customer_id does not exist",
    validation: {
      customer_required: "customer_id is required",
      request_date_required: "Request date is required",
      insurance_type_invalid: "insurance_type must be 0 or 1",
      bonus_class_required: "bonus_class is required for renewal",
      has_claims_required: "has_claims is required for renewal",
      vehicle_plate_required: "vehicle_plate is required",
      vehicle_chassis_required: "vehicle_chassis is required",
      vehicle_brand_required: "vehicle_brand is required",
      vehicle_model_required: "vehicle_model is required",
      manufacture_year_required: "manufacture_year is required",
      overnight_zipcode_required: "overnight_zipcode is required",
      driver_age_required: "driver_age is required",
      license_time_required: "license_time is required",
      insurer_preference_invalid: "has_insurer_preference must be boolean",
      preferred_insurer_required: "preferred_insurer is required when has_insurer_preference is true"
    }
  }
};
