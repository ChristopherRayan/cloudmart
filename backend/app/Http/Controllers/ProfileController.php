<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
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
                Storage::disk('public')->delete($user->profile_image);
            }

            $path = $request->file('image')->store('profile_images', 'public');

            // Generate full URL
            $url = Storage::url($path);

            // Save relative path to DB (or full URL if preferred, but usually relative)
            // Let's save the relative path but return the full URL
            $user->profile_image = $path;
            $user->save();

            // We need to return the full URL for the frontend
            // Ensure APP_URL is set correctly in .env
            $fullUrl = asset('storage/' . $path);

            return response()->json([
                'status' => 'success',
                'message' => 'Image uploaded successfully',
                'data' => [
                    'profile_image' => $path,
                    'profile_image_url' => $fullUrl
                ]
            ]);
        }

        return response()->json(['message' => 'No image uploaded'], 400);
    }
}
