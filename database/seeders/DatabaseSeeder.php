<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Store;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\TestDrive;
use App\Models\SalesFollowup;
use App\Enums\TestDriveStatus;
use App\Enums\IntentLevel;
use App\Enums\ResponsibilityRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['admin', 'store_manager', 'sales', 'receptionist', 'vehicle_manager', 'operation_manager'];
        foreach ($roles as $r) {
            Role::firstOrCreate(['name' => $r, 'guard_name' => 'web']);
        }

        $permissions = [
            'test-drives.view', 'test-drives.create', 'test-drives.update',
            'test-drives.confirm', 'test-drives.close', 'test-drives.no-show',
            'test-drives.adjust-responsibility', 'test-drives.batch',
            'customers.view', 'customers.create', 'customers.update', 'customers.batch-assign',
            'vehicles.view', 'vehicles.create', 'vehicles.update',
            'followups.view', 'followups.create', 'followups.update', 'followups.batch-complete',
            'reviews.view', 'reviews.create', 'reviews.update', 'reviews.approve',
        ];
        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        $store1 = Store::create([
            'name' => '上海浦东旗舰店',
            'code' => 'SH-PD-001',
            'address' => '上海市浦东新区张江高科技园区博云路2号',
            'phone' => '021-58886666',
            'manager_name' => '张伟',
            'manager_phone' => '13800000001',
            'status' => 1,
        ]);

        $store2 = Store::create([
            'name' => '北京朝阳店',
            'code' => 'BJ-CY-002',
            'address' => '北京市朝阳区建国路88号',
            'phone' => '010-66668888',
            'manager_name' => '李娜',
            'manager_phone' => '13800000002',
            'status' => 1,
        ]);

        $admin = User::create([
            'name' => '系统管理员',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123'),
            'phone' => '13900000001',
            'employee_no' => 'EMP00001',
            'gender' => 1,
            'position_type' => 1,
            'position_title' => '系统管理员',
            'status' => 1,
        ]);
        $admin->assignRole('admin');

        $storeManager = User::create([
            'name' => '张伟',
            'email' => 'zhangwei@example.com',
            'password' => Hash::make('password123'),
            'phone' => '13800000001',
            'employee_no' => 'EMP00101',
            'gender' => 1,
            'position_type' => 2,
            'position_title' => '浦东店店长',
            'status' => 1,
            'store_id' => $store1->id,
        ]);
        $storeManager->assignRole('store_manager');

        $sales1 = User::create([
            'name' => '王磊',
            'email' => 'wanglei@example.com',
            'password' => Hash::make('password123'),
            'phone' => '13800000011',
            'employee_no' => 'EMP00201',
            'gender' => 1,
            'position_type' => 3,
            'position_title' => '高级销售顾问',
            'status' => 1,
            'store_id' => $store1->id,
            'reporting_to' => $storeManager->id,
        ]);
        $sales1->assignRole('sales');

        $sales2 = User::create([
            'name' => '刘芳',
            'email' => 'liufang@example.com',
            'password' => Hash::make('password123'),
            'phone' => '13800000012',
            'employee_no' => 'EMP00202',
            'gender' => 2,
            'position_type' => 3,
            'position_title' => '销售顾问',
            'status' => 1,
            'store_id' => $store1->id,
            'reporting_to' => $storeManager->id,
        ]);
        $sales2->assignRole('sales');

        $vehicleMgr = User::create([
            'name' => '陈强',
            'email' => 'chenqiang@example.com',
            'password' => Hash::make('password123'),
            'phone' => '13800000021',
            'employee_no' => 'EMP00301',
            'gender' => 1,
            'position_type' => 4,
            'position_title' => '车务主管',
            'status' => 1,
            'store_id' => $store1->id,
        ]);
        $vehicleMgr->assignRole('vehicle_manager');

        $receptionist = User::create([
            'name' => '孙丽',
            'email' => 'sunli@example.com',
            'password' => Hash::make('password123'),
            'phone' => '13800000031',
            'employee_no' => 'EMP00401',
            'gender' => 2,
            'position_type' => 5,
            'position_title' => '前台接待',
            'status' => 1,
            'store_id' => $store1->id,
        ]);
        $receptionist->assignRole('receptionist');

        $carBrands = [
            ['brand' => '奔驰', 'series' => 'C级', 'model' => 'C 260 L', 'price' => 328000, 'year' => 2023, 'color' => '白色'],
            ['brand' => '宝马', 'series' => '3系', 'model' => '325Li M运动', 'price' => 298000, 'year' => 2023, 'color' => '黑色'],
            ['brand' => '奥迪', 'series' => 'A4L', 'model' => '40 TFSI 豪华致雅', 'price' => 288000, 'year' => 2023, 'color' => '银色'],
            ['brand' => '特斯拉', 'series' => 'Model 3', 'model' => '长续航全轮驱动版', 'price' => 268000, 'year' => 2024, 'color' => '红色'],
            ['brand' => '比亚迪', 'series' => '汉', 'model' => 'EV 创世版', 'price' => 258000, 'year' => 2024, 'color' => '灰色'],
            ['brand' => '丰田', 'series' => '凯美瑞', 'model' => '2.5G 豪华版', 'price' => 198000, 'year' => 2022, 'color' => '白色'],
            ['brand' => '本田', 'series' => '雅阁', 'model' => '260TURBO 旗舰版', 'price' => 188000, 'year' => 2023, 'color' => '黑色'],
            ['brand' => '大众', 'series' => '帕萨特', 'model' => '380TSI 旗舰版', 'price' => 218000, 'year' => 2022, 'color' => '金色'],
        ];

        $vehicles = collect();
        foreach ($carBrands as $i => $v) {
            $vehicle = Vehicle::create(array_merge($v, [
                'vin' => 'VIN' . str_pad((string) ($i + 1), 14, '0', STR_PAD_LEFT),
                'plate_number' => ['沪A', '沪B', '沪C', '沪D'][$i % 4] . sprintf('%05d', $i + 1),
                'mileage' => random_int(3000, 50000),
                'displacement' => (string) random_int(15, 30) / 10 . 'L',
                'transmission' => ['手自一体', '自动', 'CVT', '双离合'][$i % 4],
                'fuel_type' => ['汽油', '纯电动', '混合动力'][$i % 3],
                'seats' => 5,
                'first_register_date' => sprintf('202%d-%02d-%02d', random_int(1, 3), random_int(1, 12), random_int(1, 28)),
                'emission_standard' => 6,
                'condition_level' => random_int(2, 4),
                'is_test_drive_eligible' => true,
                'status' => 1,
                'store_id' => $store1->id,
                'created_by' => $vehicleMgr->id,
                'updated_by' => $vehicleMgr->id,
                'features' => json_encode(['全景天窗', '真皮座椅', '倒车影像', '定速巡航'], JSON_UNESCAPED_UNICODE),
                'remark' => '整备完成，状态良好',
            ]));
            $vehicles->push($vehicle);
        }

        $customerNames = ['周杰', '吴敏', '郑浩', '王林', '冯雪', '何婷', '谢辉', '唐杰', '韩梅', '曹斌', '许晨', '邓月', '萧山', '曾帆', '田野', '董楠', '高阳', '梁静', '程凯', '鲁雪'];
        $channels = ['线上广告', '线下展厅', '朋友推荐', '抖音', '小红书', '汽车之家', '懂车帝', '微信公众号'];
        $occupations = ['互联网工程师', '教师', '医生', '律师', '金融从业者', '公务员', '自由职业', '企业管理', '学生', '销售'];
        $intentWeights = [IntentLevel::LOW, IntentLevel::LOW, IntentLevel::MEDIUM, IntentLevel::MEDIUM, IntentLevel::MEDIUM, IntentLevel::HIGH, IntentLevel::HIGH, IntentLevel::VERY_HIGH, IntentLevel::DEPOSITED];
        $salesUsers = [$sales1->id, $sales2->id];

        $customers = collect();
        foreach ($customerNames as $i => $name) {
            $customer = Customer::create([
                'name' => $name,
                'phone' => '138' . sprintf('%08d', 10000000 + $i),
                'phone_secondary' => $i % 3 === 0 ? ('139' . sprintf('%08d', 20000000 + $i)) : null,
                'gender' => ($i % 2) + 1,
                'age' => random_int(22, 58),
                'occupation' => $occupations[$i % count($occupations)],
                'city' => '上海',
                'district' => ['浦东新区', '徐汇区', '黄浦区', '静安区', '长宁区'][$i % 5],
                'source_channel' => $channels[$i % count($channels)],
                'intent_level' => $intentWeights[random_int(0, count($intentWeights) - 1)]->value,
                'status' => 1,
                'tags' => json_encode(array_slice(['置换需求', '贷款需求', '首次购车', '二次购车', '家用', '商用'], 0, random_int(1, 3)), JSON_UNESCAPED_UNICODE),
                'remark' => '线上咨询后录入的客户资料',
                'store_id' => $store1->id,
                'assigned_user_id' => $salesUsers[$i % count($salesUsers)],
                'created_by' => $receptionist->id,
                'updated_by' => $receptionist->id,
            ]);
            $customers->push($customer);
        }

        $testDriveData = [
            ['status' => TestDriveStatus::PENDING, 'offset' => '+1 day', 'is_no_show' => false, 'duration' => 30],
            ['status' => TestDriveStatus::CONFIRMED, 'offset' => '+2 hours', 'is_no_show' => false, 'duration' => 45],
            ['status' => TestDriveStatus::CONFIRMED, 'offset' => '+3 hours', 'is_no_show' => false, 'duration' => 30],
            ['status' => TestDriveStatus::COMPLETED, 'offset' => '-2 day', 'is_no_show' => false, 'duration' => 40, 'satisfaction' => 5],
            ['status' => TestDriveStatus::COMPLETED, 'offset' => '-5 day', 'is_no_show' => false, 'duration' => 60, 'satisfaction' => 4],
            ['status' => TestDriveStatus::COMPLETED, 'offset' => '-1 week', 'is_no_show' => false, 'duration' => 30, 'satisfaction' => 5],
            ['status' => TestDriveStatus::NO_SHOW, 'offset' => '-3 day', 'is_no_show' => true, 'duration' => 30],
            ['status' => TestDriveStatus::NO_SHOW, 'offset' => '-4 day', 'is_no_show' => true, 'duration' => 30, 'withResponsibility' => true],
            ['status' => TestDriveStatus::IN_PROGRESS, 'offset' => '-30 minutes', 'is_no_show' => false, 'duration' => 45],
            ['status' => TestDriveStatus::CANCELLED, 'offset' => '-1 day', 'is_no_show' => false, 'duration' => 30],
            ['status' => TestDriveStatus::PENDING, 'offset' => '+2 day', 'is_no_show' => false, 'duration' => 60],
            ['status' => TestDriveStatus::COMPLETED, 'offset' => '-2 week', 'is_no_show' => false, 'duration' => 45, 'satisfaction' => 3],
        ];

        foreach ($testDriveData as $i => $data) {
            $appointmentAt = now()->modify($data['offset']);
            $vehicle = $vehicles[$i % $vehicles->count()];
            $customer = $customers[$i % $customers->count()];
            $sales = $salesUsers[$i % count($salesUsers)];

            $td = TestDrive::create([
                'code' => 'TD' . date('YmdHis', $appointmentAt->timestamp) . sprintf('%04d', $i),
                'type' => 1,
                'appointment_at' => $appointmentAt,
                'appointment_end_at' => (clone $appointmentAt)->addMinutes($data['duration']),
                'planned_duration' => $data['duration'],
                'actual_start_at' => in_array($data['status']->value, [TestDriveStatus::IN_PROGRESS->value, TestDriveStatus::COMPLETED->value])
                    ? (clone $appointmentAt)->addMinutes(random_int(0, 5)) : null,
                'actual_end_at' => $data['status'] === TestDriveStatus::COMPLETED
                    ? (clone $appointmentAt)->addMinutes($data['duration'] + random_int(-5, 10)) : null,
                'actual_duration' => $data['status'] === TestDriveStatus::COMPLETED ? ($data['duration'] + random_int(-5, 15)) : null,
                'status' => $data['status']->value,
                'is_no_show' => $data['is_no_show'],
                'no_show_reason' => $data['is_no_show'] ? random_int(1, 5) : null,
                'no_show_impact_scope' => $data['is_no_show'] ? ($i === 7 ? '1. 占用销售1小时工作时间 2. 车辆无法安排其他客户 3. 需重新安排同价位试驾车辆' : '销售排班受影响，车辆闲置1小时') : null,
                'responsibility_role' => !empty($data['withResponsibility']) ? ResponsibilityRole::CUSTOMER->value : null,
                'responsibility_note' => !empty($data['withResponsibility']) ? '客户电话无法接通，已通过微信留言告知，客户反馈临时有事无法赴约，未提前通知' : null,
                'pickup_location' => $store1->name . '正门',
                'return_location' => $store1->name . '正门',
                'planned_route' => '展厅出发→张江路→高科中路→申江路→祖冲之路→展厅返回，全程约15公里',
                'start_mileage' => $vehicle->mileage + ($i * 10),
                'end_mileage' => $data['status'] === TestDriveStatus::COMPLETED ? ($vehicle->mileage + ($i * 10) + random_int(10, 25)) : null,
                'start_fuel_level' => 85,
                'end_fuel_level' => $data['status'] === TestDriveStatus::COMPLETED ? (85 - random_int(3, 10)) : null,
                'customer_satisfaction' => $data['satisfaction'] ?? null,
                'customer_feedback' => isset($data['satisfaction']) ? match($data['satisfaction']) {
                    5 => '客户对车况和驾驶体验非常满意，已表达强烈购买意向，下一步谈价格',
                    4 => '整体满意，正在对比竞品，重点关注价格和金融方案',
                    3 => '部分满意，后排空间略小，正在考虑同品牌SUV',
                    default => null,
                } : null,
                'customer_id' => $customer->id,
                'vehicle_id' => $vehicle->id,
                'store_id' => $store1->id,
                'sales_user_id' => $sales,
                'companion_user_id' => ($i % 2 === 0) ? $vehicleMgr->id : null,
                'assigned_user_id' => $sales,
                'created_by' => ($i % 3 === 0) ? $receptionist->id : $sales,
                'updated_by' => $sales,
                'remark' => $i === 6 ? '需关注客户爽约原因' : null,
            ]);

            if ($td->status === TestDriveStatus::NO_SHOW && !empty($data['withResponsibility'])) {
                $td->responsibilityAdjustments()->create([
                    'old_responsibility_role' => null,
                    'new_responsibility_role' => ResponsibilityRole::CUSTOMER->value,
                    'old_assigned_user_id' => null,
                    'new_assigned_user_id' => $sales,
                    'reason' => '客户未提前告知爽约，属于客户责任，但销售提醒时机可优化',
                    'supplement_note' => '已标注销售需在试驾前2小时再次电话确认',
                    'impacted_areas' => '车辆排班;销售工时;其他客户预约',
                    'status' => 2,
                    'submitted_by' => $sales,
                    'approved_by' => $storeManager->id,
                    'approved_at' => now(),
                ]);
            }

            $followupCount = match ($data['status']->value) {
                TestDriveStatus::COMPLETED->value => 2,
                TestDriveStatus::NO_SHOW->value => 1,
                TestDriveStatus::CANCELLED->value => 1,
                default => 0,
            };

            for ($j = 0; $j < $followupCount; $j++) {
                $followupAt = (clone $appointmentAt)->addDays($j + 1);
                SalesFollowup::create([
                    'code' => 'FU' . date('YmdHis', $followupAt->timestamp) . sprintf('%02d', $j),
                    'type' => $data['status'] === TestDriveStatus::NO_SHOW ? 4 : ($j === 0 ? 3 : 2),
                    'channel' => random_int(1, 5),
                    'followup_at' => $followupAt,
                    'next_followup_at' => $j === $followupCount - 1 ? (clone $followupAt)->addDays(random_int(3, 7)) : null,
                    'status' => 2,
                    'intent_change' => null,
                    'content_summary' => $data['status'] === TestDriveStatus::NO_SHOW
                        ? '联系客户了解爽约原因，客户表示临时有事，安排下周末重新试驾'
                        : ($j === 0
                            ? '试驾后24小时回访，客户对试驾整体满意，重点跟进价格异议'
                            : '二次跟进，发送竞品对比资料，约定下周三到店面谈'),
                    'content_detail' => '详细沟通内容见系统通话录音及聊天记录截图',
                    'customer_question' => '价格优惠幅度;金融贷款方案;置换评估',
                    'objection' => '价格偏高、同级别竞品优惠力度大',
                    'solution' => '已申请店长特别优惠，发送金融测算表，安排评估师上门评估客户旧车',
                    'remark' => null,
                    'customer_id' => $customer->id,
                    'test_drive_id' => $td->id,
                    'vehicle_id' => $vehicle->id,
                    'store_id' => $store1->id,
                    'user_id' => $sales,
                    'created_by' => $sales,
                    'updated_by' => $sales,
                ]);
            }
        }
    }
}
