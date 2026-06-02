<?php

use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\ViewingController;
use App\Http\Middleware\EnsureUserHasCrmAccess;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('browse', 'public/browse')->name('public.browse');
Route::inertia('properties/featured', 'public/property')->name('public.property.show');
Route::inertia('my-home', 'public/my-home')->name('public.my-home');
Route::inertia('deal-tracker', 'public/deal-tracker')->name('public.deal-tracker');
Route::inertia('portal/settings', 'public/settings')->name('public.settings');

Route::middleware(['auth', 'verified', EnsureUserHasCrmAccess::class])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::resource('listings', ListingController::class);
    Route::resource('contacts', ContactController::class);
    Route::resource('inquiries', InquiryController::class);
    Route::resource('viewings', ViewingController::class);
    Route::resource('offers', OfferController::class);
    Route::resource('tasks', TaskController::class);
    Route::resource('notes', NoteController::class);
});

require __DIR__.'/settings.php';
