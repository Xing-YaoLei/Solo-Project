Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: "users/sessions",
    registrations: "users/registrations"
  }

  authenticate :user do
    root "dashboard#index", as: :authenticated_root

    get "dashboard", to: "dashboard#index"

    resources :suppliers, except: [:destroy] do
      resources :materials, controller: "supplier_materials", only: [:create, :update, :destroy]
      resources :permissions, controller: "permission_configs", only: [:create, :update, :destroy]
      member do
        get "audit_history"
      end
      collection do
        get "search"
      end
    end

    resources :audits do
      member do
        patch "transition"
        post "evidence"
        delete "evidence/:evidence_id", to: "audits#destroy_evidence", as: :destroy_evidence
        get "checklist"
        patch "checklist", to: "audits#update_checklist"
        post "generate_notification"
        get "export"
      end
      collection do
        get "search"
      end
      resources :exception_orders, shallow: true
    end

    resources :exception_orders, except: [:new, :create] do
      member do
        patch "assign"
        patch "resolve"
        patch "close"
      end
    end

    scope :reports do
      get "/", to: "reports#index", as: :reports
      post "export", to: "reports#export", as: :export_reports
      get "download/:id", to: "reports#download", as: :download_report
      get "preview", to: "reports#preview", as: :preview_reports
    end

    namespace :templates do
      resources :notification_templates, path: "notifications"
      resources :checklist_templates, path: "checklists"
    end

    namespace :admin do
      resources :users, except: [:show]
      resources :permissions, only: [:index, :update]
      resources :roles, only: [:index, :show, :update]
      get "dashboard", to: "dashboard#index"
    end

    resources :notifications, only: [:index, :show, :update] do
      collection do
        post "mark_all_read"
      end
    end

    resources :export_records, only: [:index, :show, :destroy]
  end

  unauthenticated do
    root "devise/sessions#new", as: :unauthenticated_root
  end

  get "health", to: "health#index"
  get "health/check"
  get "up" => "rails/health#show", as: :rails_health_check
end
