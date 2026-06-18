<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'employee_no', 'gender',
        'position_type', 'position_title', 'avatar', 'status',
        'remark', 'store_id', 'reporting_to',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'deleted_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reporting_to');
    }

    public function subordinates(): HasMany
    {
        return $this->hasMany(self::class, 'reporting_to');
    }

    public function testDrivesAsSales(): HasMany
    {
        return $this->hasMany(TestDrive::class, 'sales_user_id');
    }

    public function testDrivesAsAssigned(): HasMany
    {
        return $this->hasMany(TestDrive::class, 'assigned_user_id');
    }

    public function testDrivesAsCompanion(): HasMany
    {
        return $this->hasMany(TestDrive::class, 'companion_user_id');
    }

    public function assignedCustomers(): HasMany
    {
        return $this->hasMany(Customer::class, 'assigned_user_id');
    }

    public function followups(): HasMany
    {
        return $this->hasMany(SalesFollowup::class, 'user_id');
    }
}
