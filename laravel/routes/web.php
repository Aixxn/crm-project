<?php

use App\Http\Controllers\ContactController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\ViewingController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::resource('listings', ListingController::class);
    Route::resource('contacts', ContactController::class);
    Route::resource('inquiries', InquiryController::class);
    Route::resource('viewings', ViewingController::class);
    Route::resource('offers', OfferController::class);
});

require __DIR__.'/settings.php';
