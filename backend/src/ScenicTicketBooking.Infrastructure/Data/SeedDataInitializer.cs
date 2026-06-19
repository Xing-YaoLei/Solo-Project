using Microsoft.EntityFrameworkCore;
using ScenicTicketBooking.Domain.Entities;
using ScenicTicketBooking.Domain.Enums;

namespace ScenicTicketBooking.Infrastructure.Data;

public static class SeedDataInitializer
{
    public static async Task EnsureDatabaseAndSeedAsync(AppDbContext db, CancellationToken cancellationToken = default)
    {
        await db.Database.EnsureCreatedAsync(cancellationToken);

        if (await db.ScenicSpots.AnyAsync(cancellationToken))
            return;

        var now = DateTime.UtcNow;

        var spot1 = new ScenicSpot
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = "明月山国家级森林公园",
            Description = "以瀑布群、竹海、红豆杉等为特色的国家级森林公园，5A级景区。",
            Address = "江西省宜春市袁州区明月山风景名胜区",
            OpeningTime = new TimeSpan(7, 30, 0),
            ClosingTime = new TimeSpan(18, 0, 0),
            MaxDailyCapacity = 8000,
            IsActive = true,
            CreatedAt = now
        };

        var spot2 = new ScenicSpot
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Name = "温汤古井温泉度假区",
            Description = "以富硒温泉、古井文化为特色的温泉度假小镇。",
            Address = "江西省宜春市袁州区温汤镇温泉路",
            OpeningTime = new TimeSpan(9, 0, 0),
            ClosingTime = new TimeSpan(23, 0, 0),
            MaxDailyCapacity = 3000,
            IsActive = true,
            CreatedAt = now
        };

        var spot3 = new ScenicSpot
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Name = "三爪仑国家森林公园",
            Description = "被誉为『南方绿色宝库』的原始森林景区，漂流胜地。",
            Address = "江西省宜春市靖安县三爪仑乡",
            OpeningTime = new TimeSpan(8, 0, 0),
            ClosingTime = new TimeSpan(17, 30, 0),
            MaxDailyCapacity = 5000,
            IsActive = true,
            CreatedAt = now
        };

        await db.ScenicSpots.AddRangeAsync(new[] { spot1, spot2, spot3 }, cancellationToken);

        var ticketType1 = new TicketType
        {
            Id = Guid.Parse("A1A1A1A1-A1A1-A1A1-A1A1-A1A1A1A1A1A1"),
            ScenicSpotId = spot1.Id,
            Name = "成人通票",
            Description = "包含景区大门票+上行缆车+瀑布群观光",
            Price = 180m,
            SortOrder = 1,
            IsActive = true,
            CreatedAt = now
        };
        var ticketType2 = new TicketType
        {
            Id = Guid.Parse("A2A2A2A2-A2A2-A2A2-A2A2-A2A2A2A2A2A2"),
            ScenicSpotId = spot1.Id,
            Name = "学生票（凭证）",
            Description = "全日制本科及以下学生凭学生证享半价",
            Price = 90m,
            SortOrder = 2,
            IsActive = true,
            CreatedAt = now
        };
        var ticketType3 = new TicketType
        {
            Id = Guid.Parse("A3A3A3A3-A3A3-A3A3-A3A3-A3A3A3A3A3A3"),
            ScenicSpotId = spot2.Id,
            Name = "温泉标准票（平日）",
            Description = "室内外温泉泡池通票，周一至周四使用",
            Price = 258m,
            SortOrder = 1,
            IsActive = true,
            CreatedAt = now
        };
        var ticketType4 = new TicketType
        {
            Id = Guid.Parse("A4A4A4A4-A4A4-A4A4-A4A4-A4A4A4A4A4A4"),
            ScenicSpotId = spot2.Id,
            Name = "温泉周末票",
            Description = "周五至周日及法定节假日使用",
            Price = 328m,
            SortOrder = 2,
            IsActive = true,
            CreatedAt = now
        };
        var ticketType5 = new TicketType
        {
            Id = Guid.Parse("A5A5A5A5-A5A5-A5A5-A5A5-A5A5A5A5A5A5"),
            ScenicSpotId = spot3.Id,
            Name = "景区大门票+漂流套票",
            Description = "含三爪仑景区大门票及神仙谷漂流",
            Price = 218m,
            SortOrder = 1,
            IsActive = true,
            CreatedAt = now
        };

        await db.TicketTypes.AddRangeAsync(new[] { ticketType1, ticketType2, ticketType3, ticketType4, ticketType5 }, cancellationToken);

        var visitors = new List<Visitor>
        {
            new() {
                Id = Guid.Parse("B1B1B1B1-B1B1-B1B1-B1B1-B1B1B1B1B1B1"),
                Name = "张伟", IdCardNumber = "362201199005121234", PhoneNumber = "13812345678",
                Email = "zhangwei@example.com", Gender = Gender.Male, Age = 35,
                IsBlacklisted = false, CreatedAt = now
            },
            new() {
                Id = Guid.Parse("B2B2B2B2-B2B2-B2B2-B2B2-B2B2B2B2B2B2"),
                Name = "李娜", IdCardNumber = "362201199208204321", PhoneNumber = "13923456789",
                Email = "lina@example.com", Gender = Gender.Female, Age = 33,
                IsBlacklisted = false, CreatedAt = now
            },
            new() {
                Id = Guid.Parse("B3B3B3B3-B3B3-B3B3-B3B3-B3B3B3B3B3B3"),
                Name = "王芳", IdCardNumber = "362201198703127890", PhoneNumber = "13734567890",
                Email = "wangfang@example.com", Gender = Gender.Female, Age = 38,
                IsBlacklisted = false, CreatedAt = now
            },
            new() {
                Id = Guid.Parse("B4B4B4B4-B4B4-B4B4-B4B4-B4B4B4B4B4B4"),
                Name = "刘强", IdCardNumber = "362201198506015678", PhoneNumber = "13645678901",
                Email = "liuqiang@example.com", Gender = Gender.Male, Age = 40,
                IsBlacklisted = false, CreatedAt = now
            },
            new() {
                Id = Guid.Parse("B5B5B5B5-B5B5-B5B5-B5B5-B5B5B5B5B5B5"),
                Name = "陈静", IdCardNumber = "362201199912153456", PhoneNumber = "13556789012",
                Email = "chenjing@example.com", Gender = Gender.Female, Age = 26,
                IsBlacklisted = false, CreatedAt = now
            },
            new() {
                Id = Guid.Parse("B6B6B6B6-B6B6-B6B6-B6B6-B6B6B6B6B6B6"),
                Name = "杨洋", IdCardNumber = "362201199505054321", PhoneNumber = "13467890123",
                Email = "yangyang@example.com", Gender = Gender.Male, Age = 30,
                IsBlacklisted = false, CreatedAt = now
            },
            new() {
                Id = Guid.Parse("B7B7B7B7-B7B7-B7B7-B7B7-B7B7B7B7B7B7"),
                Name = "赵敏", IdCardNumber = "362201199010010007", PhoneNumber = "13378901234",
                Email = "zhaomin@example.com", Gender = Gender.Female, Age = 35,
                IsBlacklisted = false, CreatedAt = now
            },
            new() {
                Id = Guid.Parse("B8B8B8B8-B8B8-B8B8-B8B8-B8B8B8B8B8B8"),
                Name = "孙浩", IdCardNumber = "362201197809239998", PhoneNumber = "13289012345",
                Email = "sunhao@example.com", Gender = Gender.Male, Age = 47,
                IsBlacklisted = true, BlacklistReason = "多次爽约未提前取消",
                CreatedAt = now
            }
        };
        await db.Visitors.AddRangeAsync(visitors, cancellationToken);

        var timeSlots = new List<TimeSlot>();
        var slotTemplates = new (TimeSpan Start, TimeSpan End, int Cap)[]
        {
            (new TimeSpan(8, 0, 0), new TimeSpan(10, 0, 0), 200),
            (new TimeSpan(10, 0, 0), new TimeSpan(12, 0, 0), 200),
            (new TimeSpan(13, 0, 0), new TimeSpan(15, 0, 0), 200),
            (new TimeSpan(15, 0, 0), new TimeSpan(17, 0, 0), 200),
        };
        var slotTemplatesSpot2 = new (TimeSpan Start, TimeSpan End, int Cap)[]
        {
            (new TimeSpan(9, 0, 0), new TimeSpan(13, 0, 0), 100),
            (new TimeSpan(13, 0, 0), new TimeSpan(17, 0, 0), 100),
            (new TimeSpan(17, 0, 0), new TimeSpan(21, 0, 0), 100),
            (new TimeSpan(21, 0, 0), new TimeSpan(23, 0, 0), 80),
        };
        var slotTemplatesSpot3 = new (TimeSpan Start, TimeSpan End, int Cap)[]
        {
            (new TimeSpan(8, 30, 0), new TimeSpan(11, 30, 0), 150),
            (new TimeSpan(13, 30, 0), new TimeSpan(16, 30, 0), 150),
        };

        Guid SlotGuid(Guid spotId, DateOnly d, int i)
            => Guid.Parse($"{spotId.ToString("N").Substring(0, 7)}{i:D2}{d.Day:D2}{d.Month:D2}{d.Year:D4}".PadRight(32, '0'));

        var june = 6;
        var year = 2026;
        var daysInJune = DateTime.DaysInMonth(year, june);

        for (int day = 1; day <= daysInJune; day++)
        {
            var d = new DateOnly(year, june, day);
            for (int i = 0; i < slotTemplates.Length; i++)
            {
                var t = slotTemplates[i];
                timeSlots.Add(new TimeSlot
                {
                    Id = SlotGuid(spot1.Id, d, i),
                    ScenicSpotId = spot1.Id,
                    Date = d,
                    StartTime = t.Start,
                    EndTime = t.End,
                    Capacity = t.Cap,
                    BookedCount = 0,
                    IsActive = true,
                    CreatedAt = now
                });
            }
            for (int i = 0; i < slotTemplatesSpot2.Length; i++)
            {
                var t = slotTemplatesSpot2[i];
                timeSlots.Add(new TimeSlot
                {
                    Id = SlotGuid(spot2.Id, d, i),
                    ScenicSpotId = spot2.Id,
                    Date = d,
                    StartTime = t.Start,
                    EndTime = t.End,
                    Capacity = t.Cap,
                    BookedCount = 0,
                    IsActive = true,
                    CreatedAt = now
                });
            }
            for (int i = 0; i < slotTemplatesSpot3.Length; i++)
            {
                var t = slotTemplatesSpot3[i];
                timeSlots.Add(new TimeSlot
                {
                    Id = SlotGuid(spot3.Id, d, i),
                    ScenicSpotId = spot3.Id,
                    Date = d,
                    StartTime = t.Start,
                    EndTime = t.End,
                    Capacity = t.Cap,
                    BookedCount = 0,
                    IsActive = true,
                    CreatedAt = now
                });
            }
        }

        await db.TimeSlots.AddRangeAsync(timeSlots, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        var slotMap = timeSlots.ToDictionary(s => (s.ScenicSpotId, s.Date, s.StartTime));

        var rng = new Random(Seed: 20260620);

        DateOnly RandomDate() => new DateOnly(year, june, rng.Next(1, daysInJune + 1));
        TimeSlot RandomSlot(Guid spotId, DateOnly d)
        {
            var list = timeSlots.Where(s => s.ScenicSpotId == spotId && s.Date == d).ToList();
            return list[rng.Next(list.Count)];
        }

        var bookings = new List<TicketBooking>();
        var bookingId = 0;
        string BookingNo(int i) => $"BK{year}{june:D2}{i:D6}";

        (TicketType TType, Guid SpotId)[] spotTicketMap = new[]
        {
            (ticketType1, spot1.Id),
            (ticketType2, spot1.Id),
            (ticketType3, spot2.Id),
            (ticketType4, spot2.Id),
            (ticketType5, spot3.Id),
        };

        var statusesForDistribution = new[]
        {
            new { Status = BookingStatus.Arrived, Weight = 50 },
            new { Status = BookingStatus.Confirmed, Weight = 25 },
            new { Status = BookingStatus.NoShow, Weight = 5 },
            new { Status = BookingStatus.Cancelled, Weight = 10 },
            new { Status = BookingStatus.Rescheduled, Weight = 10 },
        };
        var totalWeight = statusesForDistribution.Sum(s => s.Weight);

        BookingStatus RandomStatus()
        {
            var v = rng.Next(totalWeight);
            var cum = 0;
            foreach (var s in statusesForDistribution)
            {
                cum += s.Weight;
                if (v < cum) return s.Status;
            }
            return BookingStatus.Confirmed;
        }

        int RandomQty()
        {
            var v = rng.NextDouble();
            if (v < 0.45) return 1;
            if (v < 0.8) return 2;
            if (v < 0.95) return 3;
            return rng.Next(4, 7);
        }

        for (int i = 0; i < 220; i++)
        {
            var visitor = visitors[rng.Next(visitors.Count - 1)];
            var tk = spotTicketMap[rng.Next(spotTicketMap.Length)];
            var d = RandomDate();
            var slot = RandomSlot(tk.SpotId, d);
            var status = RandomStatus();
            var qty = RandomQty();
            bookingId++;
            var b = new TicketBooking
            {
                Id = Guid.Parse($"{tk.TType.Id.ToString("N").Substring(0, 8)}{bookingId:D8}{d.Day:D2}{d.Month:D2}".PadRight(32, '0')),
                BookingNo = BookingNo(bookingId),
                ScenicSpotId = tk.SpotId,
                TimeSlotId = slot.Id,
                TicketTypeId = tk.TType.Id,
                VisitorId = visitor.Id,
                Status = status,
                Quantity = qty,
                TotalAmount = tk.TType.Price * qty,
                CreatedBy = "系统导入",
                CreatedAt = new DateTime(year, june, d.Day, 9, 0, 0, DateTimeKind.Utc)
                    .AddHours(rng.Next(0, 8)).AddMinutes(rng.Next(0, 60))
            };

            if (status == BookingStatus.Cancelled)
            {
                b.CancelledAt = b.CreatedAt.AddHours(6);
                b.CancellationReason = new[] { "行程调整", "身体原因", "天气原因", "其他" }[rng.Next(4)];
            }
            if (status == BookingStatus.Arrived)
            {
                var slotStart = TimeOnly.FromTimeSpan(slot.StartTime).AddMinutes(rng.Next(0, 30));
                b.ArrivalTime = slot.Date.ToDateTime(slotStart, DateTimeKind.Utc);
                b.ArrivalOperator = new[] { "前台-周婷", "前台-黄磊", "检票口-吴波", "移动终端-自动闸机" }[rng.Next(4)];
            }
            slot.BookedCount += qty;
            bookings.Add(b);
        }

        var reminderList = new ReminderList
        {
            Id = Guid.Parse("EEEEEEEE-EEEE-EEEE-EEEE-EEEEEEEEEEEE"),
            Name = "明月山运营应急通知名单",
            Description = "用于接收时段冲突、客流预警等紧急通知",
            ScenicSpotId = spot1.Id,
            IsActive = true,
            CreatedBy = "超级管理员",
            CreatedAt = now
        };
        await db.ReminderLists.AddAsync(reminderList, cancellationToken);
        var reminderItems = new List<ReminderListItem>
        {
            new() {
                Id = Guid.Parse("F1F1F1F1-F1F1-F1F1-F1F1-F1F1F1F1F1F1"),
                ReminderListId = reminderList.Id, PersonName = "周婷", PhoneNumber = "13800000001",
                Role = "前台主管", SortOrder = 1,
                ReceiveConflictNotifications = true, ReceiveDailySummary = true,
                IsActive = true, CreatedAt = now
            },
            new() {
                Id = Guid.Parse("F2F2F2F2-F2F2-F2F2-F2F2-F2F2F2F2F2F2"),
                ReminderListId = reminderList.Id, PersonName = "黄磊", PhoneNumber = "13800000002",
                Role = "运营经理", Email = "huangl@mingyue.com", SortOrder = 2,
                ReceiveConflictNotifications = true, ReceiveDailySummary = true, ReceiveMonthlyReport = true,
                IsActive = true, CreatedAt = now
            },
            new() {
                Id = Guid.Parse("F3F3F3F3-F3F3-F3F3-F3F3-F3F3F3F3F3F3"),
                ReminderListId = reminderList.Id, PersonName = "吴波", PhoneNumber = "13800000003",
                Role = "安全监察", SortOrder = 3,
                ReceiveConflictNotifications = true,
                IsActive = true, CreatedAt = now
            }
        };
        await db.ReminderListItems.AddRangeAsync(reminderItems, cancellationToken);

        var reschedules = new List<RescheduleRecord>();
        var rescheduledBookings = bookings.Where(b => b.Status == BookingStatus.Rescheduled).Take(8).ToList();
        foreach (var b in rescheduledBookings)
        {
            var originalSlot = timeSlots.First(s => s.Id == b.TimeSlotId);
            var newD = b.TimeSlot.Date.AddDays(rng.Next(1, 4));
            if (newD.Month != june) newD = b.TimeSlot.Date.AddDays(-2);
            var newSlot = RandomSlot(b.ScenicSpotId, newD);

            reschedules.Add(new RescheduleRecord
            {
                Id = Guid.Parse($"{b.Id.ToString("N").Substring(0, 28)}01"),
                BookingId = b.Id,
                OriginalTimeSlotId = originalSlot.Id,
                NewTimeSlotId = newSlot.Id,
                Reason = new[] { "行程调整", "会议冲突", "天气原因" }[rng.Next(3)],
                Operator = "前台-周婷",
                CreatedAt = b.CreatedAt.AddHours(2)
            });
            b.TimeSlotId = newSlot.Id;
            newSlot.BookedCount += b.Quantity;
            originalSlot.BookedCount = Math.Max(0, originalSlot.BookedCount - b.Quantity);
        }
        await db.TicketBookings.AddRangeAsync(bookings, cancellationToken);
        await db.RescheduleRecords.AddRangeAsync(reschedules, cancellationToken);

        var conflictLogs = new List<ConflictLog>();
        var notifications = new List<Notification>();
        var conflictCandidates = bookings
            .Where(b => b.Status != BookingStatus.Cancelled)
            .GroupBy(b => new { b.TimeSlotId, b.TimeSlot.Date, b.TimeSlot.StartTime, b.ScenicSpotId })
            .Where(g => g.Count() > 6)
            .Take(6)
            .ToList();

        int cid = 0;
        foreach (var grp in conflictCandidates)
        {
            cid++;
            var first = grp.First();
            var last = grp.Skip(1).First();
            var log = new ConflictLog
            {
                Id = Guid.Parse($"C0000000-0000-0000-0000-00000000000{cid}"),
                ConflictType = ConflictType.TimeSlotOverlap,
                Status = cid < 3 ? ConflictStatus.Resolved : cid < 5 ? ConflictStatus.Processing : ConflictStatus.Detected,
                BookingId = first.Id,
                RelatedBookingId = last.Id,
                TimeSlotId = grp.Key.TimeSlotId,
                Reason = $"时段 [{grp.Key.Date:yyyy-MM-dd} {grp.Key.StartTime:hh\\:mm}] 同一时段预约订单数 {grp.Count()} 超过预警阈值 6 单",
                ResponsiblePerson = "黄磊（运营经理）",
                CreatedBy = "冲突检测器",
                CreatedAt = first.CreatedAt.AddMinutes(30),
                NotifiedAt = first.CreatedAt.AddMinutes(32)
            };
            if (log.Status == ConflictStatus.Resolved)
            {
                log.ProcessedAt = first.CreatedAt.AddHours(2);
                log.ProcessedBy = "前台-周婷";
                log.ClosedAt = first.CreatedAt.AddHours(4);
                log.ResolveAction = "联系两位游客协调，已为一位游客免费改约至下一时段并赠送纪念礼品一份";
            }
            else if (log.Status == ConflictStatus.Processing)
            {
                log.ProcessedAt = first.CreatedAt.AddHours(1);
                log.ProcessedBy = "前台-周婷";
                log.ResolveAction = "已致电双方，正在协商改约方案中";
            }
            conflictLogs.Add(log);

            int nid = 0;
            foreach (var ri in reminderItems.Where(i => i.ReceiveConflictNotifications))
            {
                nid++;
                notifications.Add(new Notification
                {
                    Id = Guid.Parse($"{log.Id.ToString("N").Substring(0, 26)}{nid}"),
                    ConflictLogId = log.Id,
                    Channel = string.IsNullOrEmpty(ri.Email) ? NotificationChannel.SMS : NotificationChannel.Email,
                    Title = $"【冲突预警】{grp.Key.Date:MM-dd} {grp.Key.StartTime:hh\\:mm} 时段",
                    Content = log.Reason,
                    Recipient = ri.PersonName,
                    IsRead = nid <= 1,
                    ReadAt = nid <= 1 ? DateTime.UtcNow : null,
                    IsSent = true,
                    SentAt = log.NotifiedAt,
                    RetryCount = 0,
                    CreatedAt = log.NotifiedAt ?? log.CreatedAt
                });
            }
        }

        for (int i = 1; i <= 3; i++)
        {
            var capConflictBooking = bookings[rng.Next(bookings.Count / 2)];
            if (capConflictBooking.Status == BookingStatus.Cancelled) continue;
            cid++;
            var log = new ConflictLog
            {
                Id = Guid.Parse($"C0000000-0000-0000-0000-00000000001{i}"),
                ConflictType = ConflictType.CapacityExceeded,
                Status = i == 1 ? ConflictStatus.Resolved : ConflictStatus.Detected,
                BookingId = capConflictBooking.Id,
                TimeSlotId = capConflictBooking.TimeSlotId,
                Reason = $"{capConflictBooking.TimeSlot.Date:yyyy-MM-dd} {capConflictBooking.TimeSlot.StartTime:hh\\:mm} 时段容量超限，已售 {capConflictBooking.TimeSlot.BookedCount}/{capConflictBooking.TimeSlot.Capacity}",
                ResponsiblePerson = "黄磊（运营经理）",
                CreatedBy = "冲突检测器",
                CreatedAt = capConflictBooking.CreatedAt.AddMinutes(45)
            };
            if (log.Status == ConflictStatus.Resolved)
            {
                log.ProcessedAt = capConflictBooking.CreatedAt.AddHours(3);
                log.ProcessedBy = "安全-吴波";
                log.ResolveAction = "临时增开值班窗口+加派现场工作人员疏导，未造成事故";
                log.ClosedAt = capConflictBooking.CreatedAt.AddHours(5);
            }
            conflictLogs.Add(log);

            int nid = 0;
            foreach (var ri in reminderItems.Where(i => i.ReceiveConflictNotifications))
            {
                nid++;
                notifications.Add(new Notification
                {
                    Id = Guid.Parse($"{log.Id.ToString("N").Substring(0, 26)}{nid}"),
                    ConflictLogId = log.Id,
                    Channel = NotificationChannel.SMS,
                    Title = $"【容量预警】{capConflictBooking.TimeSlot.Date:MM-dd} {capConflictBooking.TimeSlot.StartTime:hh\\:mm}",
                    Content = log.Reason,
                    Recipient = ri.PersonName,
                    IsRead = false,
                    IsSent = true,
                    SentAt = log.CreatedAt,
                    RetryCount = 0,
                    CreatedAt = log.CreatedAt
                });
            }
        }

        var blackVisitor = visitors[7];
        DateOnly blackDate = new DateOnly(year, june, 18);
        TimeSpan blackStart = slotTemplatesSpot2[0].Start;
        var blackSlotId = slotMap[(spot2.Id, blackDate, blackStart)].Id;
        cid++;
        var blacklog = new ConflictLog
        {
            Id = Guid.Parse($"C0000000-0000-0000-0000-000000000020"),
            ConflictType = ConflictType.BlacklistVisitor,
            Status = ConflictStatus.Processing,
            TimeSlotId = blackSlotId,
            Reason = $"黑名单游客【{blackVisitor.Name}，身份证 {blackVisitor.IdCardNumber}，原因：{blackVisitor.BlacklistReason}】提交了新的预约订单",
            ResponsiblePerson = "运营经理-黄磊",
            CreatedBy = "冲突检测器",
            CreatedAt = now.AddDays(-1),
            NotifiedAt = now.AddDays(-1).AddMinutes(15)
        };
        conflictLogs.Add(blacklog);
        int idn = 0;
        foreach (var ri in reminderItems.Where(i => i.ReceiveConflictNotifications))
        {
            idn++;
            notifications.Add(new Notification
            {
                Id = Guid.Parse($"{blacklog.Id.ToString("N").Substring(0, 26)}{idn}"),
                ConflictLogId = blacklog.Id,
                Channel = NotificationChannel.Email,
                Title = "【黑名单预警】有前科游客预约",
                Content = blacklog.Reason,
                Recipient = ri.PersonName,
                IsRead = idn == 1,
                ReadAt = idn == 1 ? now.AddDays(-1).AddMinutes(20) : null,
                IsSent = true,
                SentAt = blacklog.NotifiedAt,
                RetryCount = 0,
                CreatedAt = blacklog.NotifiedAt ?? blacklog.CreatedAt
            });
        }

        await db.ConflictLogs.AddRangeAsync(conflictLogs, cancellationToken);
        await db.Notifications.AddRangeAsync(notifications, cancellationToken);

        await db.SaveChangesAsync(cancellationToken);
    }
}
