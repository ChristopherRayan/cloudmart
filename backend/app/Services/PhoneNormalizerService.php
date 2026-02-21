<?php

namespace App\Services;

class PhoneNormalizerService
{
    /**
     * Normalize a Malawian phone number.
     * Removes spaces, dashes, parentheses, and the +265 country code.
     *
     * Examples:
     *   "+265 888 123 456" → "888123456"
     *   "0888123456"       → "888123456"
     *   "888-123-456"      → "888123456"
     */
    public static function normalize(string $phone): string
    {
        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);

        // Remove Malawi country code (265) if present at start
        if (str_starts_with($phone, '265') && strlen($phone) > 9) {
            $phone = substr($phone, 3);
        }

        // Remove leading zero
        if (str_starts_with($phone, '0')) {
            $phone = substr($phone, 1);
        }

        return $phone;
    }

    /**
     * Compare two phone numbers after normalization.
     */
    public static function compare(string $phone1, string $phone2): bool
    {
        return self::normalize($phone1) === self::normalize($phone2);
    }
}
