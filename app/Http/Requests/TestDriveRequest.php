<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TestDriveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'drive_at' => 'required|date',
            'driver_name' => 'required|string|max:50',
            'driver_phone' => 'nullable|string|max:20',
            'start_mileage' => 'required|integer|min:0',
            'end_mileage' => 'nullable|integer|min:0',
            'duration_minutes' => 'nullable|integer|min:1',
            'route' => 'nullable|string',
            'performance' => 'nullable|string',
            'brake_condition' => 'nullable|string',
            'steering_condition' => 'nullable|string',
            'abnormal_noise' => 'nullable|string',
            'other_issues' => 'nullable|string',
            'rating' => 'nullable|integer|between:1,5',
            'overall_evaluation' => 'nullable|string',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:20480',
        ];
    }
}
