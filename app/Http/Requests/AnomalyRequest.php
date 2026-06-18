<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AnomalyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:missing_doc,damage_dispute,price_dispute,legal_risk,other',
            'title' => 'required|string|max:200',
            'description' => 'required|string',
            'severity' => 'required|in:low,normal,high,critical',
            'status' => 'required|in:open,in_progress,resolved,escalated,closed',
            'resolution' => 'nullable|string',
            'conclusion' => 'nullable|string',
            'source' => 'nullable|in:system,appraiser,sales,finance,manager,customer',
            'handled_by' => 'nullable|exists:users,id',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:20480',
        ];
    }
}
