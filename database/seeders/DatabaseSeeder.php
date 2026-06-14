<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\TimeSlot;
use App\Models\CapacityRule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => '系统管理员',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'phone' => '13800138000',
                'email_verified_at' => now(),
            ]
        );

        $consultant1 = User::firstOrCreate(
            ['email' => 'consultant1@example.com'],
            [
                'name' => '张老师',
                'password' => Hash::make('password'),
                'role' => 'consultant',
                'phone' => '13800138001',
                'email_verified_at' => now(),
            ]
        );

        $consultant2 = User::firstOrCreate(
            ['email' => 'consultant2@example.com'],
            [
                'name' => '李老师',
                'password' => Hash::make('password'),
                'role' => 'consultant',
                'phone' => '13800138002',
                'email_verified_at' => now(),
            ]
        );

        $courses = [
            ['name' => '少儿编程启蒙班', 'description' => '适合6-9岁儿童，Scratch图形化编程入门', 'age_range' => '6-9岁', 'duration_minutes' => 60],
            ['name' => 'Python编程基础', 'description' => '适合9-12岁儿童，Python语言入门', 'age_range' => '9-12岁', 'duration_minutes' => 90],
            ['name' => '机器人编程', 'description' => '适合7-10岁儿童，机器人搭建与编程', 'age_range' => '7-10岁', 'duration_minutes' => 90],
            ['name' => '信息学奥赛', 'description' => '适合10-15岁，C++算法竞赛', 'age_range' => '10-15岁', 'duration_minutes' => 120],
            ['name' => '创意美术', 'description' => '适合4-12岁儿童美术启蒙', 'age_range' => '4-12岁', 'duration_minutes' => 90],
            ['name' => '硬笔书法', 'description' => '适合5-12岁儿童书法启蒙', 'age_range' => '5-12岁', 'duration_minutes' => 60],
        ];

        foreach ($courses as $course) {
            Course::firstOrCreate(['name' => $course['name']], $course);
        }

        $timeSlots = [
            ['name' => '上午第一场', 'start_time' => '09:00:00', 'end_time' => '10:00:00', 'default_capacity' => 8],
            ['name' => '上午第二场', 'start_time' => '10:30:00', 'end_time' => '11:30:00', 'default_capacity' => 8],
            ['name' => '下午第一场', 'start_time' => '14:00:00', 'end_time' => '15:00:00', 'default_capacity' => 10],
            ['name' => '下午第二场', 'start_time' => '15:30:00', 'end_time' => '16:30:00', 'default_capacity' => 10],
            ['name' => '傍晚场', 'start_time' => '18:30:00', 'end_time' => '19:30:00', 'default_capacity' => 6],
            ['name' => '晚间场', 'start_time' => '20:00:00', 'end_time' => '21:00:00', 'default_capacity' => 6],
        ];

        foreach ($timeSlots as $slot) {
            $timeSlot = TimeSlot::firstOrCreate(['name' => $slot['name']], $slot);

            $weekendRule = CapacityRule::firstOrCreate(
                ['time_slot_id' => $timeSlot->id, 'rule_type' => 'special', 'day_of_week' => 0],
                [
                    'name' => '周日加开',
                    'max_capacity' => $slot['default_capacity'] + 4,
                    'warn_capacity' => $slot['default_capacity'] + 2,
                    'is_active' => true,
                ]
            );

            $saturdayRule = CapacityRule::firstOrCreate(
                ['time_slot_id' => $timeSlot->id, 'rule_type' => 'special', 'day_of_week' => 6],
                [
                    'name' => '周六加开',
                    'max_capacity' => $slot['default_capacity'] + 2,
                    'warn_capacity' => $slot['default_capacity'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('数据库种子数据创建完成！');
        $this->command->info('管理员账号: admin@example.com / password');
    }
}
