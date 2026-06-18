<?php

namespace App\Traits;

use App\Models\Attachment;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

trait HasAttachments
{
    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable')->latest();
    }

    public function addAttachment(
        UploadedFile $file,
        int $category = 1,
        ?string $description = null,
        string $disk = 'public',
        ?string $customName = null,
        ?int $userId = null
    ): Attachment
    {
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $filename = $customName ?? (uniqid() . '.' . $extension);
        $folder = 'attachments/' . strtolower(class_basename($this)) . '/' . date('Y/m/d');
        $path = $file->storeAs($folder, $filename, $disk);

        return $this->attachments()->create([
            'name' => pathinfo($originalName, PATHINFO_FILENAME),
            'original_name' => $originalName,
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'disk' => $disk,
            'category' => $category,
            'description' => $description,
            'created_by' => $userId ?? (Auth::check() ? Auth::id() : null),
        ]);
    }
}
