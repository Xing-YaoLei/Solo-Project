<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'employee_no',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function hasRole($role): bool
    {
        if (is_string($role)) {
            return $this->roles->contains('name', $role);
        }
        return !!$role->intersect($this->roles)->count();
    }

    public function hasPermission($permission): bool
    {
        return $this->roles->flatMap->permissions->contains('name', $permission);
    }

    public function isAppraiser(): bool
    {
        return $this->hasRole('appraiser');
    }

    public function isSales(): bool
    {
        return $this->hasRole('sales');
    }

    public function isFinance(): bool
    {
        return $this->hasRole('finance');
    }

    public function isManager(): bool
    {
        return $this->hasRole('manager');
    }

    public function roleLabel(): ?string
    {
        $labels = [
            'appraiser' => '评估师',
            'sales' => '销售',
            'finance' => '金融专员',
            'manager' => '店长',
        ];
        foreach ($this->roles as $role) {
            if (isset($labels[$role->name])) {
                return $labels[$role->name];
            }
        }
        return null;
    }
}
