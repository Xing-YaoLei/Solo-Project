<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class EmailVerificationPromptController extends Controller
{
    public function __invoke()
    {
        return auth()->user()->hasVerifiedEmail()
            ? redirect()->intended(route('dashboard'))
            : inertia('Auth/VerifyEmail');
    }
}
