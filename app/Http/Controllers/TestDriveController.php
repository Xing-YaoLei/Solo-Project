<?php

namespace App\Http\Controllers;

use App\Http\Requests\TestDriveRequest;
use App\Models\TestDrive;
use App\Models\Vehicle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TestDriveController extends Controller
{
    public function store(TestDriveRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $this->authorize('create', TestDrive::class);

        $data = $request->validated();
        $data['accompanied_by'] = auth()->id();

        $testDrive = $vehicle->testDrives()->create($data);

        $this->handleAttachments($request, $testDrive);

        $vehicle->logActivity(
            'test_drive_added',
            sprintf('添加试驾记录: %s, 评分 %d/5', $testDrive->driver_name, $testDrive->rating ?? 0)
        );

        return back()->with('success', '试驾记录添加成功');
    }

    public function update(TestDriveRequest $request, Vehicle $vehicle, TestDrive $testDrive): RedirectResponse
    {
        $this->authorize('update', $testDrive);

        $testDrive->update($request->validated());

        $this->handleAttachments($request, $testDrive);

        return back()->with('success', '试驾记录更新成功');
    }

    public function destroy(Vehicle $vehicle, TestDrive $testDrive): RedirectResponse
    {
        $this->authorize('delete', $testDrive);

        $testDrive->delete();

        return back()->with('success', '试驾记录已删除');
    }

    private function handleAttachments(Request $request, TestDrive $testDrive): void
    {
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $testDrive->addAttachment($file, 'photo', null, auth()->id());
            }
        }
    }
}
