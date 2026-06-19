require "sidekiq/web"

Rails.application.routes.draw do
  mount Sidekiq::Web => "/sidekiq"

  get "up" => "rails/health#show", as: :rails_health_check

  root "dashboard#index"

  resources :performances do
    resources :ticket_types, except: [:index]
    resources :seats, except: [:show]
    resources :orders, only: [:new, :create]
    get "seat_map", on: :member
    post "generate_checkin_codes", on: :member
  end

  resources :ticket_types, only: [:index]
  resources :orders, except: [:new, :create] do
    member do
      post "confirm"
      post "cancel"
      post "refund"
      post "create_exception"
    end
    resources :tickets, only: [:index, :show]
    get "export", on: :collection
  end

  resources :tickets, only: [:index, :show] do
    member do
      post "checkin"
      get "qrcode"
    end
  end

  resources :sponsors do
    resources :sponsorships, except: [:index]
  end

  resources :sponsorships, only: [:index]

  resources :checkin_codes, only: [:index, :show] do
    member do
      post "verify"
      post "use"
    end
  end

  resources :exception_records do
    member do
      post "assign"
      post "resolve"
      post "close"
    end
    get "export", on: :collection
  end

  resources :status_logs, only: [:index]

  get "reports/verification_efficiency"
  get "reports/export_verification"
end
