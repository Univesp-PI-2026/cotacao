module.exports = {
  common: {
    invalid_data: "Dados invalidos",
    not_found: "Registro nao encontrado",
    internal_server_error: "Erro interno do servidor"
  },
  auth: {
    token_missing: "Token não informado",
    token_invalid: "Token inválido ou expirado",
    invalid_credentials: "Usuário, e-mail ou senha inválidos",
    inactive_user: "Seu usuário está inativo",
    login_failed: "Não foi possível autenticar",
    validation: {
      identifier_required: "Informe o usuário ou e-mail",
      password_required: "Informe a senha"
    }
  },
  customers: {
    not_found: "Cliente nao encontrado",
    list_failed: "Falha ao listar clientes",
    fetch_failed: "Falha ao buscar cliente",
    create_failed: "Falha ao criar cliente",
    update_failed: "Falha ao atualizar cliente",
    activate_failed: "Falha ao ativar cliente",
    deactivate_failed: "Falha ao desativar cliente",
    activated_success: "Cliente ativado com sucesso",
    deactivated_success: "Cliente desativado com sucesso",
    duplicate_unique_fields: "Email, CPF ou RNM ja existe",
    validation: {
      name_required: "Nome e obrigatorio",
      email_required: "Email e obrigatorio",
      email_invalid: "Email invalido",
      is_foreign_invalid: "is_foreign deve ser booleano",
      birth_date_required: "Data de nascimento e obrigatoria",
      zip_code_required: "CEP e obrigatorio",
      street_required: "Rua e obrigatoria",
      number_required: "Numero e obrigatorio",
      district_required: "Bairro e obrigatorio",
      city_required: "Cidade e obrigatoria",
      state_required: "Estado e obrigatorio",
      cpf_required: "CPF e obrigatorio quando is_foreign for falso",
      rnm_required: "RNM e obrigatorio quando is_foreign for verdadeiro"
    }
  },
  users: {
    not_found: "Usuario nao encontrado",
    list_failed: "Falha ao listar usuarios",
    fetch_failed: "Falha ao buscar usuario",
    create_failed: "Falha ao criar usuario",
    update_failed: "Falha ao atualizar usuario",
    activate_failed: "Falha ao ativar usuario",
    deactivate_failed: "Falha ao desativar usuario",
    activated_success: "Usuario ativado com sucesso",
    deactivated_success: "Usuario desativado com sucesso",
    duplicate_user_identity: "Ja existe um usuario com esse usuario ou email",
    invalid_role: "role_id invalido",
    last_active_admin_required: "Deve existir pelo menos um admin ativo",
    validation: {
      name_required: "Nome e obrigatorio",
      username_required: "Usuario e obrigatorio",
      username_invalid: "Usuario deve ter entre 3 e 30 caracteres e usar apenas letras, numeros, ponto, traco ou underscore",
      email_required: "Email e obrigatorio",
      email_invalid: "Email invalido",
      role_required: "role_id e obrigatorio",
      password_required: "Senha e obrigatoria",
      password_min_length: "A senha deve ter pelo menos 8 caracteres"
    }
  },
  roles: {
    not_found: "Role nao encontrada",
    list_failed: "Falha ao listar roles",
    fetch_failed: "Falha ao buscar role",
    create_failed: "Falha ao criar role",
    update_failed: "Falha ao atualizar role",
    activate_failed: "Falha ao ativar role",
    deactivate_failed: "Falha ao desativar role",
    activated_success: "Role ativada com sucesso",
    deactivated_success: "Role desativada com sucesso",
    duplicate_name: "Ja existe uma role com esse nome",
    in_use: "Nao e possivel desativar esta role porque ela esta vinculada a usuarios",
    validation: {
      name_required: "Nome da role e obrigatorio"
    }
  },
  quotations: {
    not_found: "Cotacao nao encontrada",
    list_failed: "Falha ao listar cotacoes",
    fetch_failed: "Falha ao buscar cotacao",
    create_failed: "Falha ao criar cotacao",
    update_failed: "Falha ao atualizar cotacao",
    activate_failed: "Falha ao ativar cotacao",
    deactivate_failed: "Falha ao desativar cotacao",
    activated_success: "Cotacao ativada com sucesso",
    deactivated_success: "Cotacao desativada com sucesso",
    invalid_customer: "customer_id nao existe",
    validation: {
      customer_required: "customer_id e obrigatorio",
      request_date_required: "Data da solicitacao e obrigatoria",
      insurance_type_invalid: "insurance_type deve ser 0 ou 1",
      bonus_class_required: "Classe de bonus e obrigatoria para renovacao",
      has_claims_required: "has_claims e obrigatorio para renovacao",
      vehicle_plate_required: "Placa do veiculo e obrigatoria",
      vehicle_chassis_required: "Chassi do veiculo e obrigatorio",
      vehicle_brand_required: "Marca do veiculo e obrigatoria",
      vehicle_model_required: "Modelo do veiculo e obrigatorio",
      manufacture_year_required: "Ano de fabricacao e obrigatorio",
      overnight_zipcode_required: "CEP de pernoite e obrigatorio",
      driver_age_required: "Idade do condutor e obrigatoria",
      license_time_required: "Tempo de habilitacao e obrigatorio",
      insurer_preference_invalid: "has_insurer_preference deve ser booleano",
      preferred_insurer_required: "Seguradora preferida e obrigatoria quando houver preferencia"
    }
  },
  zip_codes: {
    invalid_format: "CEP invalido",
    not_found: "CEP nao encontrado",
    lookup_failed: "Falha ao consultar CEP"
  }
};
