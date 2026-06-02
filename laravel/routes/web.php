<?php

use App\Http\Controllers\BuyerDealTrackerController;
use App\Http\Controllers\BuyerHomeController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\OfferController;
use App\Http\Controllers\PortalSearchController;
use App\Http\Controllers\PublicInquiryController;
use App\Http\Controllers\PublicListingController;
use App\Http\Controllers\PublicSettingsController;
use App\Http\Controllers\PublicViewingRequestController;
use App\Http\Controllers\SavedListingController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\ViewingController;
use App\Http\Middleware\EnsureUserHasCrmAccess;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::get('browse', [PublicListingController::class, 'index'])->name('public.browse');
Route::get('properties/featured', [PublicListingController::class, 'featured'])->name('public.property.featured');
Route::get('properties/{listing}', [PublicListingController::class, 'show'])->name('public.property.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('my-home', BuyerHomeController::class)->name('public.my-home');
    Route::get('deal-tracker', BuyerDealTrackerController::class)->name('public.deal-tracker');
    Route::get('portal/settings', [PublicSettingsController::class, 'edit'])->name('public.settings');
    Route::put('portal/settings', [PublicSettingsController::class, 'update'])->name('public.settings.update');
    Route::post('properties/{listing}/inquiries', [PublicInquiryController::class, 'store'])->name('public.inquiries.store');
    Route::post('properties/{listing}/viewing-requests', [PublicViewingRequestController::class, 'store'])->name('public.viewing-requests.store');
    Route::post('saved-listings', [SavedListingController::class, 'store'])->name('public.saved-listings.store');
    Route::delete('saved-listings/{listing}', [SavedListingController::class, 'destroy'])->name('public.saved-listings.destroy');
    Route::post('recent-searches', [PortalSearchController::class, 'store'])->name('public.recent-searches.store');
    Route::delete('recent-searches/{portalSearch}', [PortalSearchController::class, 'destroy'])->name('public.recent-searches.destroy');
});

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
