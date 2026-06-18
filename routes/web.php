<?php

use App\Http\Controllers\AnomalyController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FinanceDocumentController;
use App\Http\Controllers\PreparationController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\TestDriveController;
use App\Http\Controllers\VehicleController;
use Illuminate\Support\Facades\Route;

Route::get('/login', [AuthController::class, 'login'])->name('login');
Route::post('/login', [AuthController::class, 'authenticate'])->name('login.authenticate');

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('vehicles')->name('vehicles.')->group(function () {
        Route::get('/', [VehicleController::class, 'index'])->name('index');
        Route::get('/create', [VehicleController::class, 'create'])->name('create');
        Route::post('/', [VehicleController::class, 'store'])->name('store');
        Route::post('/batch-update', [VehicleController::class, 'batchUpdate'])->name('batch-update');
        Route::get('/{vehicle}', [VehicleController::class, 'show'])->name('show');
        Route::get('/{vehicle}/edit', [VehicleController::class, 'edit'])->name('edit');
        Route::put('/{vehicle}', [VehicleController::class, 'update'])->name('update');
        Route::delete('/{vehicle}', [VehicleController::class, 'destroy'])->name('destroy');
        Route::post('/{vehicle}/update-status', [VehicleController::class, 'updateStatus'])->name('update-status');

        Route::post('/{vehicle}/preparations', [PreparationController::class, 'store'])->name('preparations.store');
        Route::put('/{vehicle}/preparations/{item}', [PreparationController::class, 'update'])->name('preparations.update');
        Route::delete('/{vehicle}/preparations/{item}', [PreparationController::class, 'destroy'])->name('preparations.destroy');
        Route::post('/{vehicle}/preparations/batch-complete', [PreparationController::class, 'batchComplete'])->name('preparations.batch-complete');

        Route::post('/{vehicle}/test-drives', [TestDriveController::class, 'store'])->name('test-drives.store');
        Route::put('/{vehicle}/test-drives/{testDrive}', [TestDriveController::class, 'update'])->name('test-drives.update');
        Route::delete('/{vehicle}/test-drives/{testDrive}', [TestDriveController::class, 'destroy'])->name('test-drives.destroy');

        Route::post('/{vehicle}/quotes', [QuoteController::class, 'store'])->name('quotes.store');
        Route::put('/{vehicle}/quotes/{quote}', [QuoteController::class, 'update'])->name('quotes.update');
        Route::delete('/{vehicle}/quotes/{quote}', [QuoteController::class, 'destroy'])->name('quotes.destroy');
        Route::post('/{vehicle}/quotes/{quote}/approve', [QuoteController::class, 'approve'])->name('quotes.approve');

        Route::post('/{vehicle}/finance-documents', [FinanceDocumentController::class, 'store'])->name('finance-documents.store');
        Route::put('/{vehicle}/finance-documents/{document}', [FinanceDocumentController::class, 'update'])->name('finance-documents.update');
        Route::delete('/{vehicle}/finance-documents/{document}', [FinanceDocumentController::class, 'destroy'])->name('finance-documents.destroy');
        Route::post('/{vehicle}/finance-documents/{document}/verify', [FinanceDocumentController::class, 'verify'])->name('finance-documents.verify');

        Route::post('/{vehicle}/anomalies', [AnomalyController::class, 'store'])->name('anomalies.store');
    });

    Route::prefix('anomalies')->name('anomalies.')->group(function () {
        Route::get('/', [AnomalyController::class, 'index'])->name('index');
        Route::get('/{anomaly}', [AnomalyController::class, 'show'])->name('show');
        Route::put('/{anomaly}/handle', [AnomalyController::class, 'handle'])->name('handle');
        Route::post('/{anomaly}/approve', [AnomalyController::class, 'approve'])->name('approve');
        Route::post('/{anomaly}/escalate', [AnomalyController::class, 'escalate'])->name('escalate');
    });

    Route::prefix('attachments')->name('attachments.')->group(function () {
        Route::post('/', [AttachmentController::class, 'store'])->name('store');
        Route::delete('/{attachment}', [AttachmentController::class, 'destroy'])->name('destroy');
        Route::get('/{attachment}/download', [AttachmentController::class, 'download'])->name('download');
    });

    Route::prefix('statistics')->name('statistics.')->group(function () {
        Route::get('/', [StatisticsController::class, 'index'])->name('index');
        Route::get('/inventory-detail', [StatisticsController::class, 'inventoryDetail'])->name('inventory-detail');
    });
});
