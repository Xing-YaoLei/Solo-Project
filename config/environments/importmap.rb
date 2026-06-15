Rails.application.configure do
  config.importmap.cache_sweepers << Rails.root.join("app/assets/javascripts")
end
