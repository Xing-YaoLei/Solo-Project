<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinanceDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:registration,vehicle_cert,purchase_invoice,insurance,inspection_report,maintenance_record,other',
            'title' => 'required|string|max:200',
            'reference_no' => 'nullable|string|max:100',
            'issue_date' => 'nullable|date',
            'expire_date' => 'nullable|date',
            'status' => 'required|in:received,verified,missing,expired',
            'verification_notes' => 'nullable|string',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:20480',
        ];
    }
}
