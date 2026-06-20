const { PrismaClient } = require('@prisma/client');
const { addDays, setHours, startOfDay } = require('date-fns');
const p = new PrismaClient();

(async () => {
  try {
    const today = startOfDay(new Date());
    const offsets = { 'perf-1': -7, 'perf-2': -2, 'perf-3': -10, 'perf-4': -5, 'perf-5': -1 };
    for (const [id, off] of Object.entries(offsets)) {
      const start = setHours(addDays(today, off), 19);
      const end = new Date(start.getTime() + 70 * 60 * 1000);
      await p.performance.update({ where: { id }, data: { startTime: start, endTime: end } });
      const exists = await p.performanceCancel.findUnique({ where: { id: 'cancel-' + id } });
      if (exists) {
        const cancelTime = new Date(start.getTime() - 24 * 60 * 60 * 1000);
        await p.performanceCancel.update({ where: { id: 'cancel-' + id }, data: { cancelTime } });
        console.log(id, '| start:', start.toISOString().slice(0,10), '| cancel:', cancelTime.toISOString().slice(0,10));
      } else {
        console.log(id, '| start:', start.toISOString().slice(0,10), '| no cancel');
      }
    }
    const agg = await p.dailyRouteStat.aggregate({ _min: { statDate: true }, _max: { statDate: true } });
    console.log('dailyRange:', agg._min.statDate?.toISOString().slice(0,10), '~', agg._max.statDate?.toISOString().slice(0,10));
    const cancels = await p.performanceCancel.findMany();
    console.log('cancels now:', cancels.map(c=>c.cancelTime.toISOString().slice(0,10)+' '+c.performanceId).join(', '));
  } catch (e) { console.error('E:', e.message); }
  finally { await p.$disconnect(); }
})();
