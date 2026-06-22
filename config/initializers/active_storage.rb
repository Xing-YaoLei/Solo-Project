Rails.application.config.to_prepare do
  ActiveStorage::Engine.config.active_storage.content_types_to_serve_as_binary -= ["image/svg+xml"]
  ActiveStorage::Engine.config.active_storage.content_types_allowed_inline += ["image/svg+xml"]
end

Rails.application.config.active_storage.service_urls_expire_in = 24.hours

ActiveStorage::Engine.config.active_storage.content_types_to_serve_as_binary += [
  "application/x-www-form-urlencoded",
  "application/xml",
  "text/xml"
]
