<?php

namespace App\Models;

use App\Traits\HasTimelines;
use App\Traits\HasAttachments;
use App\Traits\HasNotes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use SoftDeletes, HasTimelines, HasAttachments, HasNotes;

    protected $fillable = [
        'vin', 'plate_number', 'brand', 'series', 'model', 'year', 'color',
        'mileage', 'displacement', 'transmission', 'fuel_type', 'seats',
        'price', 'first_register_date', 'emission_standard',
        'condition_level', 'status', 'is_test_drive_eligible',
        'features', 'remark', 'store_id', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'first_register_date' => 'date',
            'features' => 'array',
            'is_test_drive_eligible' => 'boolean',
            'price' => 'decimal:2',
            'deleted_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function testDrives(): HasMany
    {
        return $this->hasMany(TestDrive::class);
    }

    public function followups(): HasMany
    {
        return $this->hasMany(SalesFollowup::class);
    }
}
