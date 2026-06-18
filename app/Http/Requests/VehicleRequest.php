<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vin' => 'required|string|max:50|unique:vehicles,vin,' . $this->route('vehicle')?->id,
            'plate_no' => 'nullable|string|max:20',
            'brand' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'year' => 'required|string|max:10',
            'color' => 'nullable|string|max:30',
            'mileage' => 'required|integer|min:0',
            'first_register_date' => 'nullable|date',
            'displacement' => 'nullable|string|max:20',
            'transmission' => 'nullable|string|max:20',
            'fuel_type' => 'nullable|string|max:20',
            'purchase_price' => 'nullable|numeric|min:0',
            'expected_sale_price' => 'nullable|numeric|min:0',
            'actual_sale_price' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,preparing,available,sold,cancelled',
            'source' => 'nullable|string|max:50',
            'owner_name' => 'nullable|string|max:50',
            'owner_phone' => 'nullable|string|max:20',
            'remark' => 'nullable|string',
            'appraiser_id' => 'nullable|exists:users,id',
            'sales_id' => 'nullable|exists:users,id',
            'arrival_date' => 'nullable|date',
            'sold_date' => 'nullable|date',
        ];
    }
}
