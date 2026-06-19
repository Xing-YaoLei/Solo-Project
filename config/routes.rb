Rails.application.routes.draw do
  devise_for :users
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  require "sidekiq/web"
  mount Sidekiq::Web => "/sidekiq"

  root "work_orders#index"

  resources :work_orders, except: [] do
    collection do
      patch :bulk_update_status
    end
    resources :work_order_items
    resources :work_order_parts
    resources :quotes
    resources :inspection_photos
    resources :attachments
    resources :notes
    resources :timeline_events
    resources :stock_alerts
  end

  resources :parts

  resources :stock_alerts, only: [:index, :show] do
    member do
      post :confirm_impact
      post :reassign
      post :resolve
    end
  end

  namespace :admin do
    get :dashboard
    get :repair_rate_analysis
    post :export_work_orders
  end
end
