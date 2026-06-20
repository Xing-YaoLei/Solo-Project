Rails.application.routes.draw do
  devise_for :users

  get "up" => "rails/health#show", as: :rails_health_check

  root "events#index"

  resources :events, only: %i[index show edit update] do
    resource :check_in_desk, only: %i[show], controller: "events/check_in_desks"
    resources :check_in_records, only: %i[index show create destroy]
    resources :ticket_orders, only: %i[index show edit update] do
      get :history, on: :member
    end
    resources :refund_disputes, only: %i[index show new create] do
      patch :process_dispute, on: :member
      patch :resolve, on: :member
      patch :reject, on: :member
    end
  end

  resources :reports, only: %i[index] do
    get :check_in_efficiency, on: :collection
  end
end
