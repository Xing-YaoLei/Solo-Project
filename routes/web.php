<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TestDriveController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\SalesFollowupController;
use App\Http\Controllers\ReviewMaterialController;
use App\Http\Controllers\CommonController;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('test-drives')->name('test-drives.')->group(function () {
        Route::get('/', [TestDriveController::class, 'index'])->name('index');
        Route::get('/create', [TestDriveController::class, 'create'])->name('create');
        Route::post('/', [TestDriveController::class, 'store'])->name('store');
        Route::get('/{testDrive}', [TestDriveController::class, 'show'])->name('show');
        Route::put('/{testDrive}', [TestDriveController::class, 'update'])->name('update');
        Route::post('/{testDrive}/confirm', [TestDriveController::class, 'confirm'])->name('confirm');
        Route::post('/{testDrive}/supplement', [TestDriveController::class, 'supplement'])->name('supplement');
        Route::post('/{testDrive}/close', [TestDriveController::class, 'close'])->name('close');
        Route::post('/{testDrive}/mark-no-show', [TestDriveController::class, 'markNoShow'])->name('mark-no-show');
        Route::post('/{testDrive}/adjust-responsibility', [TestDriveController::class, 'adjustResponsibility'])->name('adjust-responsibility');
        Route::post('/batch-update', [TestDriveController::class, 'batchUpdate'])->name('batch-update');
    });

    Route::prefix('customers')->name('customers.')->group(function () {
        Route::get('/', [CustomerController::class, 'index'])->name('index');
        Route::get('/create', [CustomerController::class, 'create'])->name('create');
        Route::post('/', [CustomerController::class, 'store'])->name('store');
        Route::get('/{customer}', [CustomerController::class, 'show'])->name('show');
        Route::put('/{customer}', [CustomerController::class, 'update'])->name('update');
        Route::post('/batch-assign', [CustomerController::class, 'batchAssign'])->name('batch-assign');
    });

    Route::prefix('vehicles')->name('vehicles.')->group(function () {
        Route::get('/', [VehicleController::class, 'index'])->name('index');
        Route::get('/create', [VehicleController::class, 'create'])->name('create');
        Route::post('/', [VehicleController::class, 'store'])->name('store');
        Route::get('/{vehicle}', [VehicleController::class, 'show'])->name('show');
        Route::put('/{vehicle}', [VehicleController::class, 'update'])->name('update');
    });

    Route::prefix('followups')->name('followups.')->group(function () {
        Route::get('/', [SalesFollowupController::class, 'index'])->name('index');
        Route::get('/create', [SalesFollowupController::class, 'create'])->name('create');
        Route::post('/', [SalesFollowupController::class, 'store'])->name('store');
        Route::get('/{followup}', [SalesFollowupController::class, 'show'])->name('show');
        Route::put('/{followup}', [SalesFollowupController::class, 'update'])->name('update');
        Route::post('/batch-complete', [SalesFollowupController::class, 'batchComplete'])->name('batch-complete');
    });

    Route::prefix('reviews')->name('reviews.')->group(function () {
        Route::get('/', [ReviewMaterialController::class, 'index'])->name('index');
        Route::get('/create', [ReviewMaterialController::class, 'create'])->name('create');
        Route::post('/', [ReviewMaterialController::class, 'store'])->name('store');
        Route::get('/{review}', [ReviewMaterialController::class, 'show'])->name('show');
        Route::put('/{review}', [ReviewMaterialController::class, 'update'])->name('update');
        Route::post('/{review}/link-timeline', [ReviewMaterialController::class, 'linkTimeline'])->name('link-timeline');
        Route::delete('/{review}/timelines/{timelineId}', [ReviewMaterialController::class, 'unlinkTimeline'])->name('unlink-timeline');
    });

    Route::post('/notes', [CommonController::class, 'addNote'])->name('notes.store');
    Route::put('/notes/{note}', [CommonController::class, 'updateNote'])->name('notes.update');
    Route::delete('/notes/{note}', [CommonController::class, 'deleteNote'])->name('notes.destroy');
    Route::post('/attachments', [CommonController::class, 'uploadAttachment'])->name('attachments.upload');
    Route::delete('/attachments/{attachment}', [CommonController::class, 'deleteAttachment'])->name('attachments.destroy');
});

require __DIR__.'/auth.php';
