Rails.application.routes.draw do
  root "dashboard#index"

  resources :students do
    resources :member_profiles, only: [:show, :new, :create, :edit, :update]
  end

  resources :communities

  resources :records, only: [:index]
  resources :redemption_records, only: [:index, :show]
  resources :refund_records, only: [:index, :show]

  resources :benefit_rules do
    resources :versions, only: [:index, :show], controller: "benefit_rule_versions"
  end

  resources :exams do
    collection do
      get :monthly_review
      get :export_pass_rates
    end
  end

  resources :assignments

  resources :plagiarism_logs do
    member do
      patch :resolve
      patch :close
    end
  end

  resources :operation_logs, only: [:index, :show]

  resources :export_records, only: [:index, :show, :new, :create] do
    member do
      get :download
    end
  end

  mount Sidekiq::Web => "/sidekiq" if defined?(Sidekiq)
end
