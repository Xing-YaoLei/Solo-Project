require "yaml"
require "erb"

raw = File.read(Rails.root.join("config", "database.yml"))
parsed = YAML.safe_load(ERB.new(raw).result, permitted_classes: [Symbol])
env = Rails.env

if parsed && parsed[env]
  ActiveRecord::Base.configurations = parsed
end
