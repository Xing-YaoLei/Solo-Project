<?php

namespace App\Traits;

use App\Models\Attachment;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

trait HasAttachments
{
    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable')->latest();
    }

    public function addAttachment(UploadedFile $file, string $category = 'other', ?string $description = null, ?int $userId = null): Attachment
    {
        $userId = $userId ?? auth()->id();
        $path = $file->store('attachments/' . strtolower(class_basename($this)), 'public');

        return $this->attachments()->create([
            'filename' => $file->getClientOriginalName(),
            'filepath' => $path,
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'category' => $category,
            'description' => $description,
            'uploaded_by' => $userId,
        ]);
    }

    public function getAttachmentsByCategory(string $category)
    {
        return $this->attachments()->where('category', $category)->get();
    }
}
