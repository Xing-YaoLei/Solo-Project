Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  devise_for :users

  root "dashboard#index"

  get "mobile/todos", to: "mobile/todos#index", as: :mobile_todos
  get "mobile/todos/:id", to: "mobile/todos#show", as: :mobile_todo

  namespace :desktop do
    get "analytics", to: "analytics#index"
    get "analytics/secondary_consumption", to: "analytics#secondary_consumption"
    get "exports", to: "exports#index"
    post "exports", to: "exports#create"
    get "exports/:id/download", to: "exports#download", as: :export_download
  end

  resources :heat_points do
    resources :processing_records, only: [:index, :new, :create], module: :heat_points
  end

  resources :guide_contents do
    resources :processing_records, only: [:index, :new, :create], module: :guide_contents
  end

  resources :performances do
    resources :performance_seats, only: [:index, :new, :create]
    resources :processing_records, only: [:index, :new, :create], module: :performances
    resource :cancellation, only: [:new, :create, :show, :edit, :update], module: :performances
  end

  resources :merchant_contracts do
    resources :processing_records, only: [:index, :new, :create], module: :merchant_contracts
    resources :secondary_consumptions, only: [:index, :new, :create]
  end

  resources :processing_records, only: [:index, :show, :edit, :update, :destroy] do
    member do
      post :add_attachment
      delete :remove_attachment
    end
  end

  resources :todos do
    member do
      patch :start
      patch :complete
      patch :cancel
    end
  end

  resources :performance_cancellations, only: [:index, :show] do
    member do
      post :take_over
      post :add_notes
      post :change_handler
      post :resolve
    end
  end

  resources :secondary_consumptions, only: [:index, :show]

  get "search", to: "search#index"
end
