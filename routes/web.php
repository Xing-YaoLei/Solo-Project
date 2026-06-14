<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TrialBookingController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\TimeSlotController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'verified',
])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('bookings')->name('bookings.')->group(function () {
        Route::get('/', [TrialBookingController::class, 'index'])->name('index');
        Route::get('/create', [TrialBookingController::class, 'create'])->name('create');
        Route::post('/', [TrialBookingController::class, 'store'])->name('store');
        Route::get('/{trialBooking}', [TrialBookingController::class, 'show'])->name('show');
        Route::get('/{trialBooking}/edit', [TrialBookingController::class, 'edit'])->name('edit');
        Route::put('/{trialBooking}', [TrialBookingController::class, 'update'])->name('update');

        Route::post('/{trialBooking}/status', [TrialBookingController::class, 'changeStatus'])->name('status');
        Route::post('/{trialBooking}/complete', [TrialBookingController::class, 'complete'])->name('complete');
        Route::post('/{trialBooking}/cancel', [TrialBookingController::class, 'cancel'])->name('cancel');
        Route::post('/{trialBooking}/close', [TrialBookingController::class, 'close'])->name('close');
        Route::post('/{trialBooking}/escalate', [TrialBookingController::class, 'escalate'])->name('escalate');
        Route::post('/{trialBooking}/review', [TrialBookingController::class, 'review'])->name('review');
        Route::post('/{trialBooking}/follow-up', [TrialBookingController::class, 'addFollowUp'])->name('follow-up.store');

        Route::get('/check/conflicts', [TrialBookingController::class, 'checkConflicts'])->name('check-conflicts');
    });

    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar');

    Route::get('/statistics', [StatisticsController::class, 'index'])->name('statistics');

    Route::prefix('time-slots')->name('time-slots.')->group(function () {
        Route::get('/', [TimeSlotController::class, 'index'])->name('index');
        Route::get('/create', [TimeSlotController::class, 'create'])->name('create');
        Route::post('/', [TimeSlotController::class, 'store'])->name('store');
        Route::get('/{timeSlot}/edit', [TimeSlotController::class, 'edit'])->name('edit');
        Route::put('/{timeSlot}', [TimeSlotController::class, 'update'])->name('update');
        Route::delete('/{timeSlot}', [TimeSlotController::class, 'destroy'])->name('destroy');

        Route::post('/{timeSlot}/rules', [TimeSlotController::class, 'addRule'])->name('rules.store');
        Route::put('/rules/{rule}', [TimeSlotController::class, 'updateRule'])->name('rules.update');
        Route::delete('/rules/{rule}', [TimeSlotController::class, 'deleteRule'])->name('rules.destroy');
    });
});
