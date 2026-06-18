<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quote_price' => 'required|numeric|min:0',
            'counter_offer' => 'nullable|numeric|min:0',
            'final_price' => 'nullable|numeric|min:0',
            'stage' => 'required|in:initial,negotiation,final',
            'negotiation_notes' => 'nullable|string',
            'status' => 'required|in:pending,accepted,rejected,countered',
            'remark' => 'nullable|string',
        ];
    }
}
