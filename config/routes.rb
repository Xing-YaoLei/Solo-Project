Rails.application.routes.draw do
  root "course_consumptions#index"

  resources :course_consumptions do
    member do
      post :submit_for_review
      post :approve
      post :reject
      post :process_settlement
      post :complete
      post :request_more_info
      post :escalate
      post :review_after_settlement
      post :close
    end
    collection do
      get :dashboard
      get :reports
    end
    resources :course_chapters, only: [:create, :update, :destroy]
    resources :performance_feedbacks, only: [:create, :update, :destroy]
    resources :reminder_rules, only: [:create, :update, :destroy]
    resources :review_tags, only: [:create, :destroy]
  end

  resources :members, only: [:index, :show, :new, :create, :edit, :update]
  resources :trainers, only: [:index, :show, :new, :create, :edit, :update]
  resources :course_packages, only: [:index, :show, :new, :create, :edit, :update]

  get "up" => "rails/health#show", as: :rails_health_check
end
