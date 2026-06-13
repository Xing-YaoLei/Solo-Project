require 'sidekiq/web'

Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  constraints ->(req) { req.session[:user_id] && User.find_by(id: req.session[:user_id])&.admin? } do
    mount Sidekiq::Web => "/sidekiq"
  end

  root "console#index"

  get "console" => "console#index", as: :console

  resources :pickup_orders, except: [:destroy] do
    collection do
      get :closed
      get :search
    end
    member do
      patch :submit
      patch :start_process
      patch :mark_missing_materials
      patch :materials_received
      patch :send_to_review
      patch :complete
      patch :reject_review
      patch :close
    end
  end

  resources :pickup_items, only: [:create, :update, :destroy]

  resources :after_sales_proofs, only: [:create, :update, :destroy]

  resources :shortage_records, only: [:create, :update, :destroy] do
    member do
      patch :handle
    end
  end

  resources :reports, only: [:index] do
    collection do
      get :daily_summary
      get :performance
      get :abnormal_analysis
    end
  end

  resources :users, only: [:index, :show]

  get "login" => "sessions#new"
  post "login" => "sessions#create"
  delete "logout" => "sessions#destroy"
end

