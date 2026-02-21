<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Admin sees all, User sees own
        $query = Report::with('user');

        if (!$request->user()->hasRole('admin')) {
            $query->where('user_id', $request->user()->id);
        }

        $reports = $query->latest()->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $reports
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'file' => 'nullable|file|max:10240', // 10MB max
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('reports', 'public');
        }

        $report = Report::create([
            'user_id' => $request->user()->id,
            'subject' => $validated['subject'],
            'description' => $validated['description'],
            'file_path' => $filePath,
            'status' => 'pending',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Report submitted successfully',
            'data' => $report
        ], 201);
    }

    public function show(Report $report): JsonResponse
    {
        // Check authorization
        if (request()->user()->id !== $report->user_id && !request()->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'status' => 'success',
            'data' => $report->load('user')
        ]);
    }

    public function updateStatus(Request $request, Report $report): JsonResponse
    {
        // Only admin can update status
        if (!$request->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,resolved,closed',
        ]);

        $report->update([
            'status' => $validated['status']
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Report status updated successfully',
            'data' => $report
        ]);
    }
}
