source "https://rubygems.org"

ruby ">= 3.2.0"

gem "rails", "~> 7.2.3"
gem "pg", "~> 1.1"
gem "puma", ">= 5.0"
gem "importmap-rails"
gem "turbo-rails"
gem "stimulus-rails"
gem "jbuilder"
gem "sidekiq", "~> 7.0"
gem "aasm", "~> 5.5"
gem "ransack", "~> 4.0"
gem "kaminari", "~> 1.2"
gem "groupdate", "~> 6.0"
gem "enumerize", "~> 2.7"

group :development, :test do
  gem "debug", platforms: %i[ mri windows ]
  gem "factory_bot_rails"
  gem "faker"
end

group :development do
  gem "web-console"
  gem "rubocop", require: false
  gem "rubocop-rails", require: false
end

group :test do
  gem "rspec-rails"
  gem "shoulda-matchers"
  gem "database_cleaner-active_record"
end
