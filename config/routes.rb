Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  root "dashboards#index"

  namespace :analytics do
    get :completion_rate, to: "completion_rates#index"
    get :combined_query, to: "combined_queries#index"
    get :trends, to: "trends#index"
  end

  resources :assessment_scales do
    member do
      patch :toggle_active
    end
    resources :scale_items, only: [:create, :update, :destroy], controller: "assessment_scales/scale_items"
  end
  resources :assessment_records, only: [:index, :show, :new, :create]

  resources :prescription_rules do
    patch :toggle_active, on: :member
  end
  resources :prescription_executions, only: [:index, :show]
  resources :treatment_calendars, only: [:index, :show] do
    patch :update_threshold, on: :collection
  end

  resources :equipment do
    resources :equipment_maintenances, only: [:create]
  end
  resources :nursing_logs, only: [:index, :show, :new, :create]

  resources :settlements do
    member do
      patch :submit
      patch :deny
      patch :retry
      patch :supplement
      patch :close
      get :timeline
    end
  end

  resources :notifications, only: [:index] do
    member do
      patch :mark_as_read
    end
    collection do
      patch :mark_all_as_read
    end
  end

  require 'sidekiq/web'
  mount Sidekiq::Web => '/sidekiq'
end
