Ransack.configure do |config|
  config.search_key = :q
  config.ignore_unknown_conditions = true
  config.sanitize_custom_scope_booleans = true

  config.add_predicate "date_equals",
    arel_predicate: "eq",
    formatter: proc { |v| v.to_date },
    type: :date

  config.add_predicate "date_gteq",
    arel_predicate: "gteq",
    formatter: proc { |v| v.to_date.beginning_of_day },
    type: :date

  config.add_predicate "date_lteq",
    arel_predicate: "lteq",
    formatter: proc { |v| v.to_date.end_of_day },
    type: :date
end
