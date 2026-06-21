require "sidekiq/web"

Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: 'users/sessions'
  }
  authenticate :user, ->(u) { u.admin? } do
    mount Sidekiq::Web => "/sidekiq"
  end

  get "up" => "rails/health#show", as: :rails_health_check

  authenticated :user do
    get '/', to: redirect('/manager/dashboard'), constraints: ->(req) { req.env['warden'].user&.city_manager? }, as: :manager_root
    get '/', to: redirect('/cs/dashboard'), constraints: ->(req) { req.env['warden'].user&.cs? }, as: :cs_root
    get '/', to: redirect('/merchants/dashboard'), constraints: ->(req) { req.env['warden'].user&.merchant? }, as: :merchants_root
    get '/', to: redirect('/rider/dashboard'), constraints: ->(req) { req.env['warden'].user&.rider? }, as: :rider_root
  end

  namespace :cs do
    get 'dashboard', to: 'dashboard#index'
    get '/', to: 'dashboard#index'

    resources :settlements, only: [:index, :show] do
      member do
        post 'submit_for_approval'
        post 'reject'
        post 'reassign'
        post 'supplement_material'
      end
    end

    resources :discrepancies, only: [:index, :show, :update] do
      member do
        post 'resolve'
        post 'escalate'
      end
    end

    resources :contract_attachments, only: [:index, :show, :create, :destroy]
    resources :documents, only: [:index, :show] do
      collection do
        get 'export'
      end
    end
    resources :todo_items, only: [:index, :update] do
      collection do
        post 'batch_reassign'
      end
    end
  end

  namespace :merchants do
    get 'dashboard', to: 'dashboard#index'
    get '/', to: 'dashboard#index'

    resources :settlements, only: [:index, :show] do
      member do
        post 'confirm'
        post 'raise_dispute'
      end
    end

    resources :contract_attachments, only: [:index, :show, :create]
  end

  namespace :rider do
    get 'dashboard', to: 'dashboard#index'
    get '/', to: 'dashboard#index'

    resources :delivery_orders, only: [:index, :show]
    resources :settlements, only: [:index, :show]
  end

  namespace :manager do
    get 'dashboard', to: 'dashboard#index'
    get '/', to: 'dashboard#index'

    resources :approvals, only: [:index, :show] do
      member do
        post 'approve'
        post 'reject'
      end
    end

    namespace :admin do
      resources :approval_nodes
      resources :users, only: [:index, :new, :create, :edit, :update]
    end

    resources :reports do
      collection do
        get 'overview'
        get 'payment_cycle'
        get 'by_date'
        get 'by_owner'
      end
    end
  end

  namespace :api do
    namespace :v1 do
      resources :settlements, only: [:show]
      resources :discrepancies, only: [:update]
      resources :reports do
        collection do
          get 'payment_cycle_data'
          get 'by_date_data'
          get 'by_owner_data'
        end
      end
    end
  end

  root to: 'devise/sessions#new'
end
