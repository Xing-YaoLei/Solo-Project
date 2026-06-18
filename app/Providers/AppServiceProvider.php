<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use App\Models\TestDrive;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\SalesFollowup;
use App\Models\ReviewMaterial;
use App\Models\Note;
use App\Models\Attachment;
use App\Policies\TestDrivePolicy;
use App\Policies\CustomerPolicy;
use App\Policies\VehiclePolicy;
use App\Policies\SalesFollowupPolicy;
use App\Policies\ReviewMaterialPolicy;
use App\Policies\NotePolicy;
use App\Policies\AttachmentPolicy;

class AppServiceProvider extends ServiceProvider
{
    protected $policies = [
        TestDrive::class => TestDrivePolicy::class,
        Customer::class => CustomerPolicy::class,
        Vehicle::class => VehiclePolicy::class,
        SalesFollowup::class => SalesFollowupPolicy::class,
        ReviewMaterial::class => ReviewMaterialPolicy::class,
        Note::class => NotePolicy::class,
        Attachment::class => AttachmentPolicy::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }

        Inertia::share([
            'auth' => function () {
                $user = auth()->user();
                return [
                    'user' => $user ? [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'avatar' => $user->avatar,
                        'store_id' => $user->store_id,
                        'position_title' => $user->position_title,
                        'roles' => method_exists($user, 'getRoleNames') ? $user->getRoleNames()->toArray() : [],
                        'permissions' => method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name')->toArray() : [],
                    ] : null,
                ];
            },
            'flash' => function () {
                return [
                    'success' => session('success'),
                    'error' => session('error'),
                    'warning' => session('warning'),
                    'info' => session('info'),
                ];
            },
            'ziggy' => function () {
                return array_merge((new \Tighten\Ziggy\Ziggy())->toArray(), [
                    'location' => request()->url(),
                ]);
            },
            'app' => [
                'name' => config('app.name'),
                'url' => config('app.url'),
            ],
        ]);
    }
}
