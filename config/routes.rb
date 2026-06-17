Rails.application.routes.draw do
  root "dashboard#index"

  resources :tenants do
    resources :tenant_contracts, only: %i[index new create]
  end

  resources :tenant_contracts, only: %i[index show new create edit update destroy] do
    member do
      get :audit_trail
    end
  end

  resources :parking_spots
  resources :parking_bills do
    member do
      post :pay
    end
  end

  resources :access_records, only: %i[index show create destroy]
  resources :inspection_routes

  resources :equipment_downtimes do
    member do
      post :resolve
      post :add_action
    end
  end

  resources :turnover_reports, only: %i[index show new create] do
    member do
      get :download
    end
  end

  resources :notifications, only: %i[index] do
    member do
      post :mark_read
    end
    collection do
      post :mark_all_read
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
end
