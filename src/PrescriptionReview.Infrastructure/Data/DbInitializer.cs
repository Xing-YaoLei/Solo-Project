using BCrypt.Net;
using PrescriptionReview.Domain.Entities;
using PrescriptionReview.Domain.Enums;
using PrescriptionReview.Infrastructure.Data;

namespace PrescriptionReview.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (!context.Stores.Any())
        {
            var stores = new List<Store>
            {
                new Store { Name = "总部旗舰店", Code = "HQ001", Address = "北京市朝阳区建国路88号", Phone = "010-88888888", IsActive = true, CreatedAt = DateTime.Now.AddMonths(-6) },
                new Store { Name = "海淀中关村店", Code = "HD001", Address = "北京市海淀区中关村大街1号", Phone = "010-66666666", IsActive = true, CreatedAt = DateTime.Now.AddMonths(-5) },
                new Store { Name = "西城金融街店", Code = "XC001", Address = "北京市西城区金融街甲9号", Phone = "010-77777777", IsActive = true, CreatedAt = DateTime.Now.AddMonths(-4) },
                new Store { Name = "朝阳大悦城店", Code = "CY001", Address = "北京市朝阳区朝阳北路101号", Phone = "010-55555555", IsActive = true, CreatedAt = DateTime.Now.AddMonths(-3) },
                new Store { Name = "丰台科技园店", Code = "FT001", Address = "北京市丰台区科技园航丰路8号", Phone = "010-44444444", IsActive = true, CreatedAt = DateTime.Now.AddMonths(-2) }
            };
            context.Stores.AddRange(stores);
            await context.SaveChangesAsync();
        }

        if (!context.Users.Any())
        {
            var stores = context.Stores.ToList();
            var users = new List<User>
            {
                new User { Username = "admin", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), RealName = "系统管理员", Role = UserRole.Headquarters, StoreId = stores[0].Id, Phone = "13800000000", IsActive = true, CreatedAt = DateTime.Now.AddMonths(-6) },
                new User { Username = "hq001", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), RealName = "张运营", Role = UserRole.Headquarters, StoreId = stores[0].Id, Phone = "13800000001", IsActive = true, CreatedAt = DateTime.Now.AddMonths(-5) },
                new User { Username = "manager001", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), RealName = "李店长", Role = UserRole.StoreManager, StoreId = stores[0].Id, Phone = "13800000002", IsActive = true, CreatedAt = DateTime.Now.AddMonths(-5) },
                new User { Username = "pharmacist001", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), RealName = "王药师", Role = UserRole.Pharmacist, StoreId = stores[0].Id, Phone = "13800000003", IsActive = true, CreatedAt = DateTime.Now.AddMonths(-4) },
                new User { Username = "pharmacist002", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), RealName = "赵药师", Role = UserRole.Pharmacist, StoreId = stores[1].Id, Phone = "13800000004", IsActive = true, CreatedAt = DateTime.Now.AddMonths(-4) },
                new User { Username = "cashier001", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), RealName = "孙收银", Role = UserRole.Cashier, StoreId = stores[0].Id, Phone = "13800000005", IsActive = true, CreatedAt = DateTime.Now.AddMonths(-3) },
                new User { Username = "cashier002", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), RealName = "周收银", Role = UserRole.Cashier, StoreId = stores[1].Id, Phone = "13800000006", IsActive = true, CreatedAt = DateTime.Now.AddMonths(-3) },
                new User { Username = "manager002", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), RealName = "吴店长", Role = UserRole.StoreManager, StoreId = stores[1].Id, Phone = "13800000007", IsActive = true, CreatedAt = DateTime.Now.AddMonths(-2) }
            };
            context.Users.AddRange(users);
            await context.SaveChangesAsync();
        }

        if (!context.Prescriptions.Any())
        {
            var stores = context.Stores.ToList();
            var cashiers = context.Users.Where(u => u.Role == UserRole.Cashier).ToList();
            var pharmacists = context.Users.Where(u => u.Role == UserRole.Pharmacist).ToList();

            var random = new Random();
            var statuses = new[] { PrescriptionStatus.Pending, PrescriptionStatus.Reviewing, PrescriptionStatus.Approved, PrescriptionStatus.Rejected, PrescriptionStatus.Unclear, PrescriptionStatus.SupplementRequired, PrescriptionStatus.Completed };

            for (int i = 0; i < 50; i++)
            {
                var storeIndex = random.Next(stores.Count);
                var store = stores[storeIndex];
                var storeCashiers = cashiers.Where(c => c.StoreId == store.Id).ToList();
                var cashier = storeCashiers.Any() ? storeCashiers[random.Next(storeCashiers.Count)] : cashiers[random.Next(cashiers.Count)];
                var storePharmacists = pharmacists.Where(p => p.StoreId == store.Id).ToList();
                var pharmacist = storePharmacists.Any() ? storePharmacists[random.Next(storePharmacists.Count)] : null;

                var status = statuses[random.Next(statuses.Length)];
                var prescriptionDate = DateTime.Now.AddDays(-random.Next(30));

                var prescription = new Prescription
                {
                    PrescriptionNo = $"RX{prescriptionDate:yyyyMMdd}{i + 1:D4}",
                    PatientName = GetRandomName(),
                    PatientPhone = $"139{random.Next(10000000, 99999999)}",
                    PatientIdCard = $"110101{1970 + random.Next(30)}{random.Next(1000, 9999):D4}",
                    Age = 20 + random.Next(60),
                    Gender = random.Next(2) == 0 ? "男" : "女",
                    Diagnosis = GetRandomDiagnosis(),
                    DoctorName = GetRandomDoctorName(),
                    Hospital = GetRandomHospital(),
                    PrescriptionDate = prescriptionDate,
                    StoreId = store.Id,
                    Status = status,
                    Remark = status == PrescriptionStatus.Unclear ? "处方照片模糊，需要重新上传" : null,
                    CashierId = cashier.Id,
                    PharmacistId = (status == PrescriptionStatus.Approved || status == PrescriptionStatus.Rejected || status == PrescriptionStatus.Completed) ? pharmacist?.Id : null,
                    SubmittedAt = status != PrescriptionStatus.Pending ? prescriptionDate.AddHours(random.Next(2, 8)) : null,
                    ReviewedAt = (status == PrescriptionStatus.Approved || status == PrescriptionStatus.Rejected || status == PrescriptionStatus.Completed) ? prescriptionDate.AddHours(random.Next(8, 24)) : null,
                    CreatedAt = prescriptionDate,
                    UpdatedAt = status != PrescriptionStatus.Pending ? prescriptionDate.AddHours(random.Next(2, 24)) : null
                };

                int itemCount = 2 + random.Next(4);
                for (int j = 0; j < itemCount; j++)
                {
                    prescription.Items.Add(new PrescriptionItem
                    {
                        DrugName = GetRandomDrug(),
                        Specification = GetRandomSpec(),
                        Dosage = GetRandomDosage(),
                        Frequency = GetRandomFrequency(),
                        Quantity = 1 + random.Next(5),
                        Unit = "盒",
                        Price = Math.Round((decimal)(10 + random.NextDouble() * 200), 2),
                        Remark = j == 0 ? "遵医嘱" : null,
                        CreatedAt = prescriptionDate
                    });
                }

                prescription.Attachments.Add(new Attachment
                {
                    Type = AttachmentType.PrescriptionPhoto,
                    FileName = $"prescription_{i + 1}.jpg",
                    OriginalFileName = $"处方照片_{i + 1}.jpg",
                    FilePath = $"uploads/prescription_{i + 1}.jpg",
                    FileSize = random.Next(100000, 1000000),
                    ContentType = "image/jpeg",
                    UploadedBy = cashier.Id,
                    CreatedAt = prescriptionDate
                });

                if (status == PrescriptionStatus.Unclear || status == PrescriptionStatus.SupplementRequired || random.Next(3) == 0)
                {
                    prescription.SupplementNotes.Add(new SupplementNote
                    {
                        OperatorId = cashier.Id,
                        Content = "补充患者身份证复印件",
                        Source = "线下补充",
                        CreatedAt = prescriptionDate.AddHours(random.Next(1, 24))
                    });
                }

                if (status == PrescriptionStatus.Approved || status == PrescriptionStatus.Rejected || status == PrescriptionStatus.Completed)
                {
                    prescription.PharmacistOpinions.Add(new PharmacistOpinion
                    {
                        PharmacistId = pharmacist?.Id ?? 1,
                        Opinion = status == PrescriptionStatus.Approved || status == PrescriptionStatus.Completed ? "处方合理，同意发药" : "药品配伍有问题，需要修改",
                        IsApproved = status == PrescriptionStatus.Approved || status == PrescriptionStatus.Completed,
                        CreatedAt = prescription.ReviewedAt ?? prescriptionDate.AddHours(12)
                    });

                    prescription.AuditLogs.Add(new AuditLog
                    {
                        OperatorId = pharmacist?.Id ?? 1,
                        OldStatus = PrescriptionStatus.Reviewing,
                        NewStatus = status == PrescriptionStatus.Completed ? PrescriptionStatus.Approved : status,
                        Action = status == PrescriptionStatus.Approved || status == PrescriptionStatus.Completed ? "审核通过" : "审核拒绝",
                        Remark = status == PrescriptionStatus.Rejected ? "药品剂量需要调整" : null,
                        CreatedAt = prescription.ReviewedAt ?? prescriptionDate.AddHours(12)
                    });
                }

                if (status == PrescriptionStatus.Unclear)
                {
                    prescription.AuditLogs.Add(new AuditLog
                    {
                        OperatorId = pharmacist?.Id ?? 1,
                        OldStatus = PrescriptionStatus.Reviewing,
                        NewStatus = PrescriptionStatus.Unclear,
                        Action = "标记处方不清",
                        Remark = "处方照片模糊，无法辨认",
                        CreatedAt = prescriptionDate.AddHours(random.Next(4, 12))
                    });
                }

                if (status == PrescriptionStatus.Completed && random.Next(2) == 0)
                {
                    prescription.FollowUp = new FollowUp
                    {
                        OperatorId = pharmacist?.Id ?? 1,
                        Content = "电话回访用药情况",
                        Result = "患者恢复良好，无不良反应",
                        IsCompleted = true,
                        CompletedAt = prescriptionDate.AddDays(3 + random.Next(7)),
                        Remark = "建议继续观察",
                        CreatedAt = prescriptionDate.AddDays(3)
                    };
                }

                context.Prescriptions.Add(prescription);
            }

            await context.SaveChangesAsync();
        }

        if (!context.RestockOrders.Any())
        {
            var stores = context.Stores.ToList();
            var prescriptions = context.Prescriptions.Take(20).ToList();
            var random = new Random();

            for (int i = 0; i < 30; i++)
            {
                var store = stores[random.Next(stores.Count)];
                var orderDate = DateTime.Now.AddDays(-random.Next(30));
                var prescription = random.Next(2) == 0 && prescriptions.Any() ? prescriptions[random.Next(prescriptions.Count)] : null;

                var order = new RestockOrder
                {
                    OrderNo = $"RO{orderDate:yyyyMMdd}{i + 1:D4}",
                    StoreId = store.Id,
                    PrescriptionId = prescription?.Id,
                    OrderDate = orderDate,
                    ItemCount = 3 + random.Next(8),
                    Status = random.Next(3) == 0 ? "已完成" : random.Next(2) == 0 ? "处理中" : "待处理",
                    OperatorId = prescription?.CashierId ?? 1,
                    CreatedAt = orderDate,
                    UpdatedAt = orderDate.AddHours(random.Next(2, 24))
                };

                decimal total = 0;
                for (int j = 0; j < order.ItemCount; j++)
                {
                    var price = Math.Round((decimal)(20 + random.NextDouble() * 300), 2);
                    var qty = 1 + random.Next(10);
                    var amount = Math.Round(price * qty, 2);
                    total += amount;

                    order.Items.Add(new RestockOrderItem
                    {
                        DrugName = GetRandomDrug(),
                        Specification = GetRandomSpec(),
                        Quantity = qty,
                        Unit = "盒",
                        Price = price,
                        Amount = amount,
                        BatchNo = $"{random.Next(1000, 9999)}-{random.Next(2020, 2025)}",
                        ExpireDate = DateTime.Now.AddMonths(6 + random.Next(30)),
                        CreatedAt = orderDate
                    });
                }
                order.TotalAmount = Math.Round(total, 2);

                context.RestockOrders.Add(order);
            }

            await context.SaveChangesAsync();
        }

        if (!context.InsuranceRecords.Any())
        {
            var stores = context.Stores.ToList();
            var prescriptions = context.Prescriptions.Where(p => p.Status == PrescriptionStatus.Approved || p.Status == PrescriptionStatus.Completed).Take(20).ToList();
            var random = new Random();

            for (int i = 0; i < 35; i++)
            {
                var store = stores[random.Next(stores.Count)];
                var tradeDate = DateTime.Now.AddDays(-random.Next(30));
                var prescription = random.Next(3) == 0 && prescriptions.Any() ? prescriptions[random.Next(prescriptions.Count)] : null;
                var totalAmount = Math.Round((decimal)(50 + random.NextDouble() * 800), 2);
                var insurancePay = Math.Round(totalAmount * (decimal)(0.5 + random.NextDouble() * 0.3), 2);

                var record = new InsuranceRecord
                {
                    RecordNo = $"INS{tradeDate:yyyyMMdd}{i + 1:D4}",
                    StoreId = store.Id,
                    PrescriptionId = prescription?.Id,
                    PatientName = prescription?.PatientName ?? GetRandomName(),
                    IdCard = prescription?.PatientIdCard ?? $"110101{1970 + random.Next(30)}{random.Next(1000, 9999):D4}",
                    InsuranceCardNo = $"BJ{random.Next(100000000, 999999999)}",
                    TradeDate = tradeDate,
                    TotalAmount = totalAmount,
                    InsurancePay = insurancePay,
                    SelfPay = Math.Round(totalAmount - insurancePay, 2),
                    TradeType = "门诊",
                    Status = random.Next(10) == 0 ? "待对账" : "已结算",
                    CreatedAt = tradeDate,
                    UpdatedAt = tradeDate.AddHours(random.Next(1, 12))
                };

                context.InsuranceRecords.Add(record);
            }

            await context.SaveChangesAsync();
        }
    }

    private static string GetRandomName()
    {
        var surnames = new[] { "张", "王", "李", "赵", "刘", "陈", "杨", "黄", "周", "吴" };
        var names = new[] { "伟", "芳", "娜", "敏", "静", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明" };
        var random = new Random();
        return surnames[random.Next(surnames.Length)] + names[random.Next(names.Length)] + (random.Next(2) == 0 ? names[random.Next(names.Length)] : "");
    }

    private static string GetRandomDiagnosis()
    {
        var diagnoses = new[] { "上呼吸道感染", "高血压", "糖尿病", "胃炎", "支气管炎", "关节炎", "失眠", "过敏性鼻炎", "偏头痛", "冠心病" };
        return diagnoses[new Random().Next(diagnoses.Length)];
    }

    private static string GetRandomDoctorName()
    {
        var surnames = new[] { "陈", "林", "黄", "刘", "杨" };
        var names = new[] { "医生", "主任", "医师", "副主任" };
        var random = new Random();
        return surnames[random.Next(surnames.Length)] + names[random.Next(names.Length)];
    }

    private static string GetRandomHospital()
    {
        var hospitals = new[] { "北京协和医院", "北京大学第一医院", "人民医院", "中日友好医院", "天坛医院", "朝阳医院", "友谊医院" };
        return hospitals[new Random().Next(hospitals.Length)];
    }

    private static string GetRandomDrug()
    {
        var drugs = new[] { "阿莫西林胶囊", "布洛芬缓释片", "奥美拉唑肠溶胶囊", "二甲双胍片", "硝苯地平控释片", "氯雷他定片", "头孢克肟分散片", "左氧氟沙星片", "阿司匹林肠溶片", "复方甘草片", "板蓝根颗粒", "感冒灵颗粒", "维生素C片", "钙片", "鱼油软胶囊" };
        return drugs[new Random().Next(drugs.Length)];
    }

    private static string GetRandomSpec()
    {
        var specs = new[] { "0.25g*24粒", "0.5g*12片", "10mg*7片", "20mg*14粒", "50mg*30片", "100mg*10粒", "0.1g*20片", "25mg*100片" };
        return specs[new Random().Next(specs.Length)];
    }

    private static string GetRandomDosage()
    {
        var dosages = new[] { "每次1片", "每次2粒", "每次1袋", "每次0.5g", "每次10mg", "每次20mg", "每次1片" };
        return dosages[new Random().Next(dosages.Length)];
    }

    private static string GetRandomFrequency()
    {
        var frequencies = new[] { "每日3次", "每日2次", "每日1次", "隔日1次", "按需服用", "睡前服用" };
        return frequencies[new Random().Next(frequencies.Length)];
    }
}
