<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:20480',
            'attachable_type' => 'required|string',
            'attachable_id' => 'required|integer',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $validTypes = [
            'App\Models\Vehicle',
            'App\Models\PreparationItem',
            'App\Models\TestDrive',
            'App\Models\QuoteHistory',
            'App\Models\FinanceDocument',
            'App\Models\Anomaly',
        ];

        $attachableType = $request->input('attachable_type');
        if (!in_array($attachableType, $validTypes)) {
            return response()->json(['message' => '无效的关联类型'], 422);
        }

        $attachable = $attachableType::findOrFail($request->input('attachable_id'));
        $file = $request->file('file');

        $attachment = $attachable->addAttachment(
            $file,
            $request->input('category', 'other'),
            $request->input('description'),
            auth()->id()
        );

        $attachment->load('uploader:id,name');
        $attachment->append(['file_url', 'human_size']);

        return response()->json(['data' => $attachment]);
    }

    public function destroy(Attachment $attachment): RedirectResponse
    {
        $this->authorize('delete', $attachment);

        Storage::disk('public')->delete($attachment->filepath);
        $attachment->delete();

        return back()->with('success', '附件已删除');
    }

    public function download(Attachment $attachment)
    {
        return Storage::disk('public')->download($attachment->filepath, $attachment->filename);
    }
}
