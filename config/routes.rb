Rails.application.routes.draw do
  require "sidekiq/web"
  mount Sidekiq::Web => "/sidekiq"

  get "up" => "rails/health#show", as: :rails_health_check

  root "dashboard#index"

  get "dashboard", to: "dashboard#index"
  get "dashboard/statistics", to: "dashboard#statistics"

  resources :clients do
    collection do
      get :search
    end
  end

  resources :legal_cases, path: "cases" do
    member do
      post :submit
      post :start_processing
      post :request_materials
      post :materials_received
      post :escalate_review
      post :review_approved
      post :complete
      post :close
      post :reopen
    end

    resources :case_stages, only: [:create, :update, :destroy]
    resources :evidence_attachments, only: [:create, :update, :destroy] do
      member do
        post :upload
      end
    end
    resources :follow_ups, only: [:create, :update, :destroy]
    resources :review_records, only: [:create, :update, :destroy]
  end
end
