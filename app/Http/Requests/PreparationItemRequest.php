<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PreparationItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => 'required|in:exterior,interior,mechanical,electrical,other',
            'name' => 'required|string|max:200',
            'description' => 'nullable|string',
            'estimated_cost' => 'nullable|numeric|min:0',
            'actual_cost' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'handled_by' => 'nullable|exists:users,id',
            'resolution' => 'nullable|string',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:20480',
        ];
    }
}
