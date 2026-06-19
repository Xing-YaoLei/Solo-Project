Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  require "sidekiq/web"
  authenticate :user, ->(user) { user.manager? } do
    mount Sidekiq::Web => "/sidekiq"
  end

  devise_for :users

  root to: "dashboard#index"
  get "dashboard", to: "dashboard#index", as: :dashboard

  resources :packages do
    member do
      post :adjust_inventory
    end
    resources :price_rules, only: [:index, :new, :create]
  end

  resources :channels do
    resources :price_rules, only: [:index]
  end

  resources :price_rules, only: [:show, :edit, :update, :destroy]

  resources :orders do
    member do
      post :confirm
      post :cancel
      post :check_in
      post :complete
    end
    collection do
      get :oversold
    end
    resources :check_in_records, only: [:new, :create]
    resources :redemption_records, only: [:new, :create]
    resources :oversell_communications, only: [:create]
    resources :oversell_reviews, only: [:new, :create]
  end

  resources :check_in_records, only: [:index, :show, :edit, :update, :destroy]
  resources :redemption_records, only: [:index, :show, :edit, :update, :destroy] do
    member do
      post :redeem
    end
  end
end
