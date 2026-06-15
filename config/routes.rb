Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "dashboard#index"
  get "dashboard", to: "dashboard#index"

  resources :courses do
    resources :chapters, except: [:index] do
      resources :lessons, except: [:index]
    end
    resources :question_banks do
      resources :questions
    end
    resources :exams
    resources :live_sessions
    resources :certificates
  end

  resources :channels
  resources :users

  resources :orders do
    member do
      post :pay
      post :refund
    end
  end

  resources :enrollments do
    member do
      post :start_learning
      post :complete
    end
    resources :lesson_progresses, only: [:show, :update]
    resources :practice_records, only: [:index, :create]
    resources :exam_records, only: [:index, :show, :create]
    resources :follow_ups
    resources :appeals
    resources :qa_threads do
      resources :qa_replies, only: [:create]
    end
  end

  resources :settlements do
    member do
      post :calculate
      post :approve
      post :reject
      get :export
    end
    resources :settlement_items, only: [:index]
  end

  resources :follow_ups, only: [:index, :show, :edit, :update] do
    collection do
      post :generate
    end
    member do
      post :contact
      post :resolve
      post :close
    end
  end

  resources :appeals, only: [:index, :show, :edit, :update] do
    member do
      post :process_appeal
      post :approve
      post :reject
    end
  end

  namespace :admin do
    resources :courses
    resources :users
    resources :channels
  end
end
