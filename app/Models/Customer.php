<?php

namespace App\Models;

use App\Traits\HasTimelines;
use App\Traits\HasAttachments;
use App\Traits\HasNotes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Enums\IntentLevel;

class Customer extends Model
{
    use SoftDeletes, HasTimelines, HasAttachments, HasNotes;

    protected $fillable = [
        'name', 'phone', 'phone_secondary', 'gender', 'age', 'occupation',
        'city', 'district', 'source_channel', 'intent_level', 'status',
        'tags', 'remark', 'store_id', 'assigned_user_id', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'intent_level' => IntentLevel::class,
            'tags' => 'array',
            'deleted_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function testDrives(): HasMany
    {
        return $this->hasMany(TestDrive::class);
    }

    public function followups(): HasMany
    {
        return $this->hasMany(SalesFollowup::class);
    }

    public function reviewMaterials(): HasMany
    {
        return $this->hasMany(ReviewMaterial::class);
    }
}
