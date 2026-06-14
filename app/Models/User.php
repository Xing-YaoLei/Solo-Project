<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function assignedBookings(): HasMany
    {
        return $this->hasMany(TrialBooking::class, 'assigned_to');
    }

    public function createdBookings(): HasMany
    {
        return $this->hasMany(TrialBooking::class, 'created_by');
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(BookingFollowUp::class, 'created_by');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isManager(): bool
    {
        return in_array($this->role, ['admin', 'manager']);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
