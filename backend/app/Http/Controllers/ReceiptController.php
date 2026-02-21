<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ReceiptController extends Controller
{
    /**
     * GET /api/orders/{orderId}/receipt
     * Render receipt inline in browser.
     */
    public function generateReceipt(Request $request, string $orderId): Response
    {
        $order = $this->resolveAuthorizedOrder($request, $orderId);
        if (!$order instanceof Order) {
            return $order;
        }

        $filename = "receipt-{$order->order_id}-" . date('Y-m-d') . '.pdf';
        $pdf = $this->buildReceiptPdf($order);

        return response($pdf)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', "inline; filename={$filename}")
            ->header('Content-Length', (string) strlen($pdf));
    }

    /**
     * GET /api/orders/{orderId}/download-receipt
     * Download receipt as PDF.
     */
    public function downloadReceipt(Request $request, string $orderId): Response
    {
        $order = $this->resolveAuthorizedOrder($request, $orderId);
        if (!$order instanceof Order) {
            return $order;
        }

        $filename = "receipt-{$order->order_id}-" . date('Y-m-d') . '.pdf';
        $pdf = $this->buildReceiptPdf($order);

        return response($pdf)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', "attachment; filename={$filename}")
            ->header('Content-Length', (string) strlen($pdf));
    }

    /**
     * Resolve order and enforce owner/admin access.
     */
    private function resolveAuthorizedOrder(Request $request, string $orderId): Order|Response
    {
        $user = $request->user();

        $order = Order::with([
            'user',
            'orderItems.product',
            'deliveryLocation',
            'deliveryZone',
        ])
            ->where('order_id', $orderId)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Order not found.',
            ], 404);
        }

        if (!$user->hasRole('admin') && $order->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Unauthorized to access this order.',
            ], 403);
        }

        return $order;
    }

    /**
     * Generate a valid PDF binary without external packages.
     */
    private function buildReceiptPdf(Order $order): string
    {
        $safe = static fn (?string $value): string => str_replace(
            ['\\', '(', ')'],
            ['\\\\', '\\(', '\\)'],
            trim((string) ($value ?? 'N/A'))
        );

        $deliveryName = $order->deliveryLocation->name ?? $order->deliveryZone->zone_name ?? 'N/A';
        $createdAt = $order->created_at?->format('M j, Y g:i A') ?? date('M j, Y g:i A');
        $deliveryFee = (float) ($order->delivery_fee ?? 0);
        $subtotal = (float) $order->orderItems->sum('subtotal');
        $grandTotal = (float) $order->total_amount;
        $statusText = strtoupper(str_replace('_', ' ', (string) $order->status));
        $formatMoney = static fn (float $amount): string => 'MWK ' . number_format($amount, 2);

        $stream = '';
        $writeText = function (
            string $text,
            int $x,
            int $y,
            int $fontSize = 11,
            bool $bold = false,
            float $r = 0.08,
            float $g = 0.12,
            float $b = 0.20
        ) use (&$stream, $safe): void {
            $font = $bold ? '/F2' : '/F1';
            $stream .= sprintf('%.3F %.3F %.3F rg ', $r, $g, $b);
            $stream .= "BT {$font} {$fontSize} Tf {$x} {$y} Td (" . $safe($text) . ") Tj ET\n";
        };

        // Premium header.
        $stream .= "1 1 1 rg 0 0 595 842 re f\n";
        $stream .= "0.08 0.14 0.30 rg 0 782 595 60 re f\n";
        $stream .= "0.95 0.37 0.07 rg 0 772 595 8 re f\n";
        $writeText('CLOUDMART RECEIPT', 42, 812, 21, true, 1, 1, 1);
        $writeText('Premium Order Invoice', 44, 796, 10, false, 0.92, 0.95, 1);
        $writeText('Order: ' . $order->order_id, 408, 812, 12, true, 1, 1, 1);
        $writeText('Issued: ' . $createdAt, 396, 796, 10, false, 0.92, 0.95, 1);

        // Watermarks (color intensity reduced to keep content dominant).
        $watermarks = [
            [0.71, 0.80, 0.97, 54, 100, 600],
            [0.94, 0.78, 0.63, 46, 188, 480],
            [0.69, 0.88, 0.78, 40, 255, 360],
            [0.75, 0.86, 0.97, 36, 320, 255],
            [0.92, 0.82, 0.96, 30, 390, 160],
            [0.82, 0.90, 0.99, 26, 438, 95],
        ];
        foreach ($watermarks as [$r, $g, $b, $size, $tx, $ty]) {
            $stream .= sprintf(
                "q %.3F %.3F %.3F rg 0.84 0.28 -0.28 0.84 %d %d cm BT /F2 %d Tf (CLOUDMART) Tj ET Q\n",
                $r,
                $g,
                $b,
                $tx,
                $ty,
                $size
            );
        }

        // Customer and delivery summary cards.
        $stream .= "0.96 0.97 1 rg 38 682 252 82 re f\n";
        $stream .= "0.90 0.92 0.96 RG 38 682 252 82 re S\n";
        $stream .= "0.96 0.97 1 rg 305 682 252 82 re f\n";
        $stream .= "0.90 0.92 0.96 RG 305 682 252 82 re S\n";

        $writeText('Billed To', 50, 748, 11, true, 0.09, 0.18, 0.34);
        $writeText((string) ($order->customer_name ?: $order->user?->name), 50, 730, 11, true, 0.08, 0.12, 0.20);
        $writeText('Phone: ' . (string) ($order->customer_phone ?: $order->user?->phone), 50, 714, 10);
        $writeText('Address: ' . (string) ($order->customer_address ?: $order->user?->address), 50, 699, 10);

        $writeText('Delivery Details', 317, 748, 11, true, 0.09, 0.18, 0.34);
        $writeText('Location: ' . $deliveryName, 317, 730, 10);
        $writeText('Payment: ' . strtoupper((string) $order->payment_method), 317, 714, 10);
        $writeText('Status: ' . $statusText, 317, 699, 10, true, 0.06, 0.37, 0.67);
        $writeText('Delivery Code: ' . (string) ($order->delivery_code ?? 'N/A'), 317, 684, 10, true, 0.78, 0.32, 0.06);

        // Items table.
        $stream .= "0.10 0.16 0.31 rg 38 642 519 24 re f\n";
        $stream .= "0.86 0.90 0.96 RG 38 642 519 24 re S\n";
        $writeText('ITEM DESCRIPTION', 50, 650, 10, true, 1, 1, 1);
        $writeText('QTY', 336, 650, 10, true, 1, 1, 1);
        $writeText('UNIT PRICE', 396, 650, 10, true, 1, 1, 1);
        $writeText('TOTAL', 500, 650, 10, true, 1, 1, 1);

        $rowY = 622;
        foreach ($order->orderItems as $item) {
            if ($rowY < 290) {
                $writeText('Additional items omitted for single-page receipt.', 50, $rowY, 9, false, 0.48, 0.52, 0.62);
                break;
            }

            $stream .= "0.92 0.94 0.98 RG 38 {$rowY} 519 22 re S\n";
            $writeText((string) ($item->product?->name ?? 'Item'), 50, $rowY + 8, 10);
            $writeText((string) ((int) $item->quantity), 344, $rowY + 8, 10, true);
            $writeText(number_format((float) $item->price, 2), 402, $rowY + 8, 10);
            $writeText(number_format((float) $item->subtotal, 2), 500, $rowY + 8, 10, true);
            $rowY -= 24;
        }

        // Totals section.
        $stream .= "0.96 0.97 1 rg 336 184 221 88 re f\n";
        $stream .= "0.90 0.92 0.96 RG 336 184 221 88 re S\n";
        $writeText('Subtotal:', 350, 252, 11, true);
        $writeText($formatMoney($subtotal), 458, 252, 11, true);
        $writeText('Delivery Fee:', 350, 234, 11, true);
        $writeText($formatMoney($deliveryFee), 458, 234, 11, true);
        $writeText('Grand Total:', 350, 212, 12, true, 0.10, 0.18, 0.34);
        $writeText($formatMoney($grandTotal), 452, 212, 12, true, 0.85, 0.33, 0.05);

        // Footer.
        $stream .= "0.88 0.90 0.94 RG 38 152 519 1 re S\n";
        $writeText('Thank you for shopping with Cloudmart.', 42, 136, 10, true, 0.24, 0.28, 0.36);
        $writeText('This is a system-generated receipt and serves as proof of purchase.', 42, 121, 9, false, 0.46, 0.50, 0.60);

        $streamLength = strlen($stream);

        $objects = [
            1 => "<< /Type /Catalog /Pages 2 0 R >>",
            2 => "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            3 => "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>",
            4 => "<< /Length {$streamLength} >>\nstream\n{$stream}endstream",
            5 => "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            6 => "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $id => $object) {
            $offsets[$id] = strlen($pdf);
            $pdf .= "{$id} 0 obj\n{$object}\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $count = count($objects) + 1;

        $pdf .= "xref\n0 {$count}\n";
        $pdf .= "0000000000 65535 f \n";

        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf('%010d 00000 n ' . "\n", $offsets[$i]);
        }

        $pdf .= "trailer\n<< /Size {$count} /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xrefOffset}\n%%EOF";

        return $pdf;
    }
}
