<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyHandshakeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('delivery_staff');
    }

    public function rules(): array
    {
        return [
            'order_id' => 'required|string|max:50',
            'delivery_code' => 'required|digits:4',
        ];
    }

    public function messages(): array
    {
        return [
            'order_id.required' => 'Please enter the order ID.',
            'delivery_code.required' => 'Please enter the 4-digit delivery code.',
            'delivery_code.digits' => 'Delivery code must be exactly 4 digits.',
        ];
    }
}
