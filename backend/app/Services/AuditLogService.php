<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditLogService
{
    public function log(string $action, string $resourceType, string $resourceId, ?string $description = null): void
    {
        $user = Auth::user();
        
        AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'Guest',
            'user_email' => $user?->email ?? 'guest@example.com',
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'description' => $description,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    public function getLogs(array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = AuditLog::orderBy('created_at', 'desc');

        if (!empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (!empty($filters['user'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('user_name', 'like', '%' . $filters['user'] . '%')
                  ->orWhere('user_email', 'like', '%' . $filters['user'] . '%');
            });
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->paginate($filters['per_page'] ?? 10);
    }
}