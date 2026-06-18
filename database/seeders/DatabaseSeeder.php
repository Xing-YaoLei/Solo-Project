<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'vehicle.view', 'label' => '查看车辆'],
            ['name' => 'vehicle.create', 'label' => '创建车辆'],
            ['name' => 'vehicle.update', 'label' => '更新车辆'],
            ['name' => 'vehicle.delete', 'label' => '删除车辆'],
            ['name' => 'vehicle.batch_update', 'label' => '批量更新车辆'],
            ['name' => 'vehicle.export', 'label' => '导出车辆'],

            ['name' => 'preparation.create', 'label' => '创建整备项目'],
            ['name' => 'preparation.update', 'label' => '更新整备项目'],
            ['name' => 'preparation.delete', 'label' => '删除整备项目'],

            ['name' => 'test_drive.create', 'label' => '创建试驾记录'],
            ['name' => 'test_drive.update', 'label' => '更新试驾记录'],
            ['name' => 'test_drive.delete', 'label' => '删除试驾记录'],

            ['name' => 'quote.create', 'label' => '创建报价'],
            ['name' => 'quote.update', 'label' => '更新报价'],
            ['name' => 'quote.delete', 'label' => '删除报价'],
            ['name' => 'quote.approve', 'label' => '审批报价'],

            ['name' => 'finance.create', 'label' => '创建金融资料'],
            ['name' => 'finance.update', 'label' => '更新金融资料'],
            ['name' => 'finance.delete', 'label' => '删除金融资料'],

            ['name' => 'anomaly.create', 'label' => '创建异常'],
            ['name' => 'anomaly.handle', 'label' => '处理异常'],
            ['name' => 'anomaly.approve', 'label' => '审批异常'],

            ['name' => 'statistics.view', 'label' => '查看统计'],
        ];

        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p['name']], $p);
        }

        $roles = [
            'manager' => [
                'name' => 'manager',
                'label' => '店长',
                'permissions' => collect($permissions)->pluck('name')->all(),
            ],
            'appraiser' => [
                'name' => 'appraiser',
                'label' => '评估师',
                'permissions' => [
                    'vehicle.view', 'vehicle.create', 'vehicle.update',
                    'preparation.create', 'preparation.update',
                    'test_drive.create', 'test_drive.update',
                    'quote.create', 'quote.update',
                    'anomaly.create', 'anomaly.handle',
                ],
            ],
            'sales' => [
                'name' => 'sales',
                'label' => '销售',
                'permissions' => [
                    'vehicle.view', 'vehicle.create', 'vehicle.update',
                    'test_drive.create', 'test_drive.update',
                    'quote.create', 'quote.update',
                    'anomaly.create',
                ],
            ],
            'finance' => [
                'name' => 'finance',
                'label' => '金融专员',
                'permissions' => [
                    'vehicle.view',
                    'finance.create', 'finance.update', 'finance.delete',
                    'anomaly.create', 'anomaly.handle',
                    'statistics.view',
                ],
            ],
        ];

        foreach ($roles as $roleData) {
            $role = Role::firstOrCreate(['name' => $roleData['name']], [
                'label' => $roleData['label'],
            ]);
            $role->permissions()->sync(
                Permission::whereIn('name', $roleData['permissions'])->pluck('id')
            );
        }

        $users = [
            [
                'name' => '店长',
                'email' => 'manager@example.com',
                'role' => 'manager',
            ],
            [
                'name' => '张评估师',
                'email' => 'appraiser@example.com',
                'role' => 'appraiser',
            ],
            [
                'name' => '李销售',
                'email' => 'sales@example.com',
                'role' => 'sales',
            ],
            [
                'name' => '王金融',
                'email' => 'finance@example.com',
                'role' => 'finance',
            ],
        ];

        foreach ($users as $userData) {
            $user = User::firstOrCreate([
                'email' => $userData['email'],
            ], [
                'name' => $userData['name'],
                'password' => Hash::make('password'),
                'employee_no' => strtoupper($userData['role']) . '001',
            ]);

            $role = Role::where('name', $userData['role'])->first();
            if ($role && !$user->roles->contains($role->id)) {
                $user->roles()->attach($role);
            }
        }

        $manager = User::where('email', 'manager@example.com')->first();

        $vehicles = [
            [
                'vin' => 'LSVAM4183G2123456',
                'brand' => '大众',
                'model' => '帕萨特',
                'year' => 2019,
                'color' => '黑色',
                'mileage' => 68000,
                'displacement' => '1.8T',
                'transmission' => '自动',
                'fuel_type' => '汽油',
                'first_register_date' => '2019-03-15',
                'arrival_date' => Carbon::now()->subDays(15)->toDateString(),
                'status' => 'available',
                'source' => '个人车主',
                'owner_name' => '张先生',
                'owner_phone' => '13800138001',
                'purchase_price' => 125000,
                'expected_sale_price' => 148000,
                'created_by' => $manager?->id ?? 1,
                'remark' => '车况良好，全程4S店保养，有轻微划痕',
            ],
            [
                'vin' => 'LGBF1DE04DY123456',
                'brand' => '别克',
                'model' => '君越',
                'year' => 2020,
                'color' => '白色',
                'mileage' => 45000,
                'displacement' => '2.0T',
                'transmission' => '自动',
                'fuel_type' => '汽油',
                'first_register_date' => '2020-06-20',
                'arrival_date' => Carbon::now()->subDays(8)->toDateString(),
                'status' => 'preparing',
                'source' => '置换',
                'owner_name' => '李女士',
                'owner_phone' => '13900139002',
                'purchase_price' => 158000,
                'expected_sale_price' => 185000,
                'created_by' => $manager?->id ?? 1,
                'remark' => '需要做前保险杠喷漆和轮胎更换',
            ],
            [
                'vin' => 'WVWSR7A30ME123456',
                'brand' => '奥迪',
                'model' => 'A4L',
                'year' => 2021,
                'color' => '银色',
                'mileage' => 32000,
                'displacement' => '2.0T',
                'transmission' => '自动',
                'fuel_type' => '汽油',
                'first_register_date' => '2021-09-10',
                'arrival_date' => Carbon::now()->subDays(3)->toDateString(),
                'status' => 'pending',
                'source' => '中介介绍',
                'owner_name' => '王先生',
                'owner_phone' => '13700137003',
                'purchase_price' => 220000,
                'expected_sale_price' => 258000,
                'created_by' => $manager?->id ?? 1,
                'remark' => '待评估，车主急售',
            ],
        ];

        foreach ($vehicles as $vehicleData) {
            Vehicle::firstOrCreate(['vin' => $vehicleData['vin']], $vehicleData);
        }
    }
}
