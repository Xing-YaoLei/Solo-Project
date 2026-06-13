"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.user.deleteMany();
    await prisma.visitResult.deleteMany();
    await prisma.problemTag.deleteMany();
    await prisma.responsibilityRule.deleteMany();
    const admin = await prisma.user.create({
        data: {
            name: '系统管理员',
            email: 'admin@solo.com',
            role: client_1.UserRole.ADMIN,
            region: '总部',
        },
    });
    const manager1 = await prisma.user.create({
        data: {
            name: '张经理',
            email: 'zhang.manager@solo.com',
            role: client_1.UserRole.MANAGER,
            region: '华东区',
            phone: '13800138001',
        },
    });
    const manager2 = await prisma.user.create({
        data: {
            name: '李经理',
            email: 'li.manager@solo.com',
            role: client_1.UserRole.MANAGER,
            region: '华南区',
            phone: '13800138002',
        },
    });
    const operators = await Promise.all([
        prisma.user.create({
            data: {
                name: '王客服',
                email: 'wang.operator@solo.com',
                role: client_1.UserRole.OPERATOR,
                region: '华东区',
                phone: '13800138003',
            },
        }),
        prisma.user.create({
            data: {
                name: '陈客服',
                email: 'chen.operator@solo.com',
                role: client_1.UserRole.OPERATOR,
                region: '华南区',
                phone: '13800138004',
            },
        }),
        prisma.user.create({
            data: {
                name: '刘客服',
                email: 'liu.operator@solo.com',
                role: client_1.UserRole.OPERATOR,
                region: '华北区',
                phone: '13800138005',
            },
        }),
    ]);
    await prisma.visitResult.createMany({
        data: [
            { code: 'SUCCESS_REFUND', name: '退款成功', sortOrder: 1 },
            { code: 'SUCCESS_EXCHANGE', name: '换货成功', sortOrder: 2 },
            { code: 'SUCCESS_COMPENSATE', name: '补偿成功', sortOrder: 3 },
            { code: 'CUSTOMER_CANCEL', name: '用户取消', sortOrder: 4 },
            { code: 'CUSTOMER_NO_RESPONSE', name: '用户无响应', sortOrder: 5 },
            { code: 'REJECTED_INVALID', name: '诉求无效驳回', sortOrder: 6 },
            { code: 'PROCESSING', name: '处理中', sortOrder: 7 },
            { code: 'NEED_FOLLOWUP', name: '需跟进', sortOrder: 8 },
        ],
    });
    await prisma.problemTag.createMany({
        data: [
            { name: '商品质量问题', color: '#ef4444', thresholdDays: 3, sortOrder: 1 },
            { name: '物流配送延迟', color: '#f59e0b', thresholdDays: 5, sortOrder: 2 },
            { name: '商品破损', color: '#ef4444', thresholdDays: 2, sortOrder: 3 },
            { name: '错发漏发', color: '#8b5cf6', thresholdDays: 3, sortOrder: 4 },
            { name: '规格不符', color: '#06b6d4', thresholdDays: 5, sortOrder: 5 },
            { name: '临近过期', color: '#f97316', thresholdDays: 2, sortOrder: 6 },
            { name: '价格争议', color: '#10b981', thresholdDays: 7, sortOrder: 7 },
            { name: '虚假宣传', color: '#ec4899', thresholdDays: 3, sortOrder: 8 },
            { name: '团长服务问题', color: '#6366f1', thresholdDays: 5, sortOrder: 9 },
            { name: '其他问题', color: '#6b7280', thresholdDays: 7, sortOrder: 10 },
        ],
    });
    await prisma.responsibilityRule.createMany({
        data: [
            {
                name: '质量问题-平台责任',
                problemTags: ['商品质量问题', '商品破损', '临近过期'],
                responsibility: client_1.ResponsibilityParty.PLATFORM,
                priority: 10,
            },
            {
                name: '物流问题-物流责任',
                problemTags: ['物流配送延迟'],
                responsibility: client_1.ResponsibilityParty.LOGISTICS,
                priority: 8,
            },
            {
                name: '商家责任',
                problemTags: ['错发漏发', '规格不符', '虚假宣传'],
                responsibility: client_1.ResponsibilityParty.MERCHANT,
                priority: 9,
            },
            {
                name: '华东区指派',
                regions: ['华东区'],
                responsibility: client_1.ResponsibilityParty.PLATFORM,
                assigneeId: operators[0].id,
                priority: 5,
            },
            {
                name: '华南区指派',
                regions: ['华南区'],
                responsibility: client_1.ResponsibilityParty.PLATFORM,
                assigneeId: operators[1].id,
                priority: 5,
            },
        ],
    });
    const sampleOrders = [
        {
            orderNo: 'SO202606010001',
            customerName: '张三',
            customerPhone: '13900139001',
            region: '华东区',
            community: '阳光花园',
            groupLeader: '王团长',
            productName: '有机苹果',
            productSku: 'APPLE-001',
            quantity: 2,
            unitPrice: 15.9,
            refundAmount: 31.8,
            reason: '收到苹果有腐烂情况',
            problemTags: ['商品破损', '商品质量问题'],
            status: client_1.RefundStatus.PROCESSING,
            visitResult: 'PROCESSING',
            responsibility: client_1.ResponsibilityParty.PLATFORM,
            assigneeId: operators[0].id,
            deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            isUrgent: true,
            createdById: admin.id,
        },
        {
            orderNo: 'SO202606010002',
            customerName: '李四',
            customerPhone: '13900139002',
            region: '华南区',
            community: '翡翠湾',
            groupLeader: '李团长',
            productName: '进口牛奶',
            productSku: 'MILK-002',
            quantity: 1,
            unitPrice: 68.0,
            refundAmount: 68.0,
            reason: '牛奶已过期',
            problemTags: ['临近过期'],
            status: client_1.RefundStatus.EVIDENCE_UPLOADED,
            visitResult: 'SUCCESS_REFUND',
            responsibility: client_1.ResponsibilityParty.SUPPLIER,
            assigneeId: operators[1].id,
            deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            isUrgent: true,
            createdById: admin.id,
        },
        {
            orderNo: 'SO202606010003',
            customerName: '王五',
            customerPhone: '13900139003',
            region: '华北区',
            community: '新城花园',
            groupLeader: '张团长',
            productName: '精品大米',
            productSku: 'RICE-003',
            quantity: 3,
            unitPrice: 39.9,
            refundAmount: 119.7,
            reason: '配送延迟，商品变质',
            problemTags: ['物流配送延迟', '商品质量问题'],
            status: client_1.RefundStatus.PENDING,
            responsibility: client_1.ResponsibilityParty.LOGISTICS,
            deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            isTimeout: true,
            timeoutCount: 1,
            createdById: admin.id,
        },
        {
            orderNo: 'SO202606010004',
            customerName: '赵六',
            customerPhone: '13900139004',
            region: '华东区',
            community: '湖畔小区',
            groupLeader: '刘团长',
            productName: '土鸡蛋',
            productSku: 'EGG-004',
            quantity: 1,
            unitPrice: 29.9,
            refundAmount: 29.9,
            reason: '收到商品规格与描述不符',
            problemTags: ['规格不符'],
            status: client_1.RefundStatus.CLOSED,
            visitResult: 'SUCCESS_REFUND',
            responsibility: client_1.ResponsibilityParty.MERCHANT,
            assigneeId: operators[0].id,
            deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            actualClosedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            handlingDurationMinutes: 4320,
            createdById: admin.id,
        },
        {
            orderNo: 'SO202606010005',
            customerName: '孙七',
            customerPhone: '13900139005',
            region: '华南区',
            community: '海景花园',
            groupLeader: '陈团长',
            productName: '新鲜草莓',
            productSku: 'BERRY-005',
            quantity: 2,
            unitPrice: 25.0,
            refundAmount: 50.0,
            reason: '少发一盒',
            problemTags: ['错发漏发'],
            status: client_1.RefundStatus.REVIEWING,
            visitResult: 'NEED_FOLLOWUP',
            responsibility: client_1.ResponsibilityParty.MERCHANT,
            assigneeId: operators[1].id,
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            createdById: admin.id,
        },
        {
            orderNo: 'SO202606010006',
            customerName: '周八',
            customerPhone: '13900139006',
            region: '华东区',
            community: '阳光花园',
            productName: '进口牛排',
            productSku: 'STEAK-006',
            quantity: 1,
            unitPrice: 128.0,
            refundAmount: 128.0,
            reason: '解冻后发现肉质有问题',
            problemTags: ['商品质量问题'],
            status: client_1.RefundStatus.RETRY,
            visitResult: 'NEED_FOLLOWUP',
            responsibility: client_1.ResponsibilityParty.SUPPLIER,
            assigneeId: operators[0].id,
            deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
            createdById: admin.id,
        },
        {
            orderNo: 'SO202606010007',
            customerName: '吴九',
            customerPhone: '13900139007',
            region: '华北区',
            community: '金茂府',
            groupLeader: '赵团长',
            productName: '海鲜礼盒',
            productSku: 'SEAFOOD-007',
            quantity: 1,
            unitPrice: 298.0,
            refundAmount: 298.0,
            reason: '不新鲜，有异味',
            problemTags: ['商品质量问题'],
            status: client_1.RefundStatus.CLOSED,
            visitResult: 'SUCCESS_REFUND',
            responsibility: client_1.ResponsibilityParty.PLATFORM,
            assigneeId: operators[2].id,
            deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            actualClosedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            handlingDurationMinutes: 10080,
            createdById: admin.id,
        },
        {
            orderNo: 'SO202606010008',
            customerName: '郑十',
            customerPhone: '13900139008',
            region: '华南区',
            community: '碧桂园',
            productName: '零食礼包',
            productSku: 'SNACK-008',
            quantity: 1,
            unitPrice: 88.0,
            refundAmount: 44.0,
            reason: '部分零食已过期，要求部分退款',
            problemTags: ['临近过期'],
            status: client_1.RefundStatus.SUPPLEMENT,
            visitResult: 'NEED_FOLLOWUP',
            responsibility: client_1.ResponsibilityParty.SUPPLIER,
            assigneeId: operators[1].id,
            deadline: new Date(Date.now() - 12 * 60 * 60 * 1000),
            isTimeout: true,
            timeoutCount: 2,
            createdById: admin.id,
        },
    ];
    for (const orderData of sampleOrders) {
        const order = await prisma.refundOrder.create({ data: orderData });
        await prisma.refundTimeline.create({
            data: {
                refundOrderId: order.id,
                action: 'CREATED',
                newStatus: order.status,
                note: '售后单创建',
                operatorId: admin.id,
            },
        });
        if (order.assigneeId) {
            await prisma.refundTimeline.create({
                data: {
                    refundOrderId: order.id,
                    action: 'ASSIGNED',
                    newValue: order.assigneeId,
                    note: '分配处理人',
                    operatorId: admin.id,
                },
            });
        }
        if (order.status === client_1.RefundStatus.CLOSED) {
            await prisma.refundTimeline.create({
                data: {
                    refundOrderId: order.id,
                    action: 'CLOSED',
                    oldStatus: client_1.RefundStatus.REVIEWING,
                    newStatus: client_1.RefundStatus.CLOSED,
                    note: `售后关闭，结果：${order.visitResult}`,
                    operatorId: manager1.id,
                    createdAt: order.actualClosedAt,
                },
            });
        }
    }
    console.log('Seed data created successfully!');
    console.log('Admin:', admin.email);
    console.log('Managers:', manager1.email, manager2.email);
    console.log('Operators:', operators.map(o => o.email).join(', '));
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map