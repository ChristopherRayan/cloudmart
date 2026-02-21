<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('customer');
    }

    public function rules(): array
    {
        return [
            'delivery_location_id' => 'required|exists:delivery_locations,id',
            'payment_method' => 'required|in:cash,mobile_money',
            'notes' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'accuracy' => 'nullable|numeric|min:0|max:100', // Accuracy in meters
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_address' => 'required|string',
        ];
    }

    public function messages(): array
    {
        return [
            'delivery_location_id.required' => 'Please select a delivery location.',
            'delivery_location_id.exists' => 'The selected delivery location is invalid.',
            'payment_method.required' => 'Please select a payment method.',
            'payment_method.in' => 'Payment method must be either cash or mobile money.',
        ];
    }
}
