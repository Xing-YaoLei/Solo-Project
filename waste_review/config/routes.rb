Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "dashboard#index"

  resources :waste_reports do
    member do
      post :review
      post :approve
      post :reject
      post :settle
      get :download
    end
    collection do
      get :statistics
      get :export_batch
    end
    resources :cost_entries, only: %i[create destroy]
    resources :review_opinions, only: %i[create]
  end

  resources :abnormal_reports, only: %i[index show update] do
    member do
      post :resolve
    end
    collection do
      get :export
    end
  end
end
