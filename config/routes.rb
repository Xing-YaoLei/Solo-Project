Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "dashboard#index"

  resources :documents do
    member do
      post :submit_for_review
      post :start_review
      post :approve
      post :reject
      post :resubmit
      post :schedule
      post :publish
      post :archive
      post :unarchive
      post :scan_risk_words
      get  :history
      get  :versions
      get  :export
    end
    resources :review_opinions, only: %i[create]
    resources :publish_schedules, only: %i[create]
    resources :interaction_records, only: %i[create]
  end

  resources :exception_orders, only: %i[index show edit update] do
    member do
      post :start_processing
      post :resolve
      post :close
      post :reopen
    end
  end

  resources :risk_words
  resources :users, only: %i[index show]
end
