<?php

namespace App\Services;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ListingWebhookSignature
{
    public function validate(Request $request): void
    {
        $secret = config('services.listing_webhook.secret');

        abort_if(! is_string($secret) || $secret === '', Response::HTTP_SERVICE_UNAVAILABLE);

        $timestamp = $request->header('X-Webhook-Timestamp');
        $signature = $request->header('X-Webhook-Signature');

        abort_if(! is_string($timestamp) || ! ctype_digit($timestamp), Response::HTTP_UNAUTHORIZED);
        abort_if(! is_string($signature) || $signature === '', Response::HTTP_UNAUTHORIZED);

        $tolerance = (int) config('services.listing_webhook.signature_tolerance', 300);

        abort_if(abs(now()->timestamp - (int) $timestamp) > $tolerance, Response::HTTP_UNAUTHORIZED);

        $expected = hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $secret);
        $normalizedSignature = str_starts_with($signature, 'sha256=')
            ? substr($signature, 7)
            : $signature;

        abort_unless(hash_equals($expected, $normalizedSignature), Response::HTTP_UNAUTHORIZED);
    }
}
