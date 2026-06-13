source "https://rubygems.org"

gem "rails", "~> 7.2.0"
gem "propshaft"
gem "pg", "~> 1.1"
gem "puma", ">= 5.0"
gem "jsbundling-rails"
gem "turbo-rails"
gem "stimulus-rails"
gem "cssbundling-rails"

gem "bcrypt", "~> 3.1.7"

gem "sidekiq"
gem "aasm"
gem "ransack"
gem "kaminari"
gem "date_validator"
gem "groupdate"

gem "tzinfo-data", platforms: %i[ windows jruby ]

gem "bootsnap", require: false
gem "image_processing", "~> 1.2"

group :development, :test do
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"
  gem "bundler-audit", require: false
  gem "brakeman", require: false
  gem "rubocop-rails-omakase", require: false
  gem "factory_bot_rails"
  gem "faker"
end

group :development do
  gem "web-console"
end
