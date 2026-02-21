<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        $productId = $this->route('id');

        return [
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'slug' => "sometimes|string|max:255|unique:products,slug,{$productId}",
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0|lt:price',
            'stock_quantity' => 'sometimes|integer|min:0',
            'image_url' => 'nullable|string|max:500',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }
}
