if Rails.application.config.respond_to?(:assets)
  Rails.application.config.assets.version = "1.0"
  Rails.application.config.assets.paths << Rails.root.join("app", "assets", "fonts")
  Rails.application.config.assets.precompile += %w[
    application.css
    application.js
    tailwind.css
  ]
  Rails.application.config.assets.css_compressor = nil
  Rails.application.config.assets.js_compressor = nil
end
