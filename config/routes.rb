require "sidekiq/web"

Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  mount Sidekiq::Web => "/sidekiq"

  root "records#index"

  resources :records, only: [:index]
  resources :properties
  resources :channel_orders
  resources :cleaning_tasks
  resources :room_conflicts do
    member do
      post :acknowledge
      post :resolve
      post :close
    end
  end
  resources :check_in_documents
  resources :monthly_reports do
    collection do
      post :generate
      get :download
    end
  end
  resources :report_downloads, only: [:index, :show, :destroy]

  get "login", to: "sessions#new", as: :login
  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy", as: :logout
end
