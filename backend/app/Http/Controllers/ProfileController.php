<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'data' => $user
        ]);
    }

    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($user->profile_image) {
                $relativePath = $this->resolvePublicStorageRelativePath($user->profile_image, 'profile_images');
                if ($relativePath && Storage::disk('public')->exists($relativePath)) {
                    Storage::disk('public')->delete($relativePath);
                }
            }

            $path = $request->file('image')->store('profile_images', 'public');

            // Save relative path to DB and return a browser-safe /storage URL.
            $user->profile_image = $path;
            $user->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Image uploaded successfully',
                'data' => [
                    'profile_image' => $path,
                    'profile_image_url' => Storage::url($path)
                ]
            ]);
        }

        return response()->json(['message' => 'No image uploaded'], 400);
    }

    private function resolvePublicStorageRelativePath(?string $value, string $defaultDirectory): ?string
    {
        if (!$value) {
            return null;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return null;
        }

        if (filter_var($trimmed, FILTER_VALIDATE_URL)) {
            $path = parse_url($trimmed, PHP_URL_PATH);
            if ($path) {
                $trimmed = $path;
            }
        }

        if (Str::startsWith($trimmed, '/storage/')) {
            return ltrim(Str::after($trimmed, '/storage/'), '/');
        }

        if (Str::startsWith($trimmed, 'storage/')) {
            return ltrim(Str::after($trimmed, 'storage/'), '/');
        }

        if (Str::contains($trimmed, '/')) {
            return ltrim($trimmed, '/');
        }

        return trim($defaultDirectory, '/') . '/' . ltrim($trimmed, '/');
    }
}
