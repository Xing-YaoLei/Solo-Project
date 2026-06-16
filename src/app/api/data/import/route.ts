import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cleanPatientData, cleanAppointmentData, cleanChargeData, matchPatientByKeys } from '@/services/dataCleaningService';
import type { RawPatientData, RawAppointmentData, RawChargeData } from '@/services/dataCleaningService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source, dataType, rawData } = body;

    if (!source || !dataType || !Array.isArray(rawData)) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数: source, dataType, rawData',
        },
        { status: 400 }
      );
    }

    let cleanResult;
    let importedCount = 0;
    let failedCount = 0;

    if (dataType === 'patient') {
      cleanResult = cleanPatientData(rawData as RawPatientData[]);

      for (const patient of cleanResult.cleaned) {
        try {
          await prisma.patient.upsert({
            where: { patientNo: patient.patientNo || patient.hisPatientId || '' },
            create: {
              patientNo: patient.patientNo || patient.hisPatientId || '',
              name: patient.name || '',
              gender: patient.gender,
              birthDate: patient.birthDate ? new Date(patient.birthDate) : null,
              phone: patient.phone,
              idCardNo: patient.idCardNo,
              address: patient.address,
              source: source,
              hisPatientId: patient.hisPatientId,
            },
            update: {
              name: patient.name,
              gender: patient.gender,
              birthDate: patient.birthDate ? new Date(patient.birthDate) : undefined,
              phone: patient.phone,
              address: patient.address,
            },
          });
          importedCount++;
        } catch (e) {
          failedCount++;
          console.error('导入患者失败:', e);
        }
      }
    } else if (dataType === 'appointment') {
      cleanResult = cleanAppointmentData(rawData as RawAppointmentData[]);

      const existingPatients = await prisma.patient.findMany({
        select: { id: true, patientNo: true, hisPatientId: true, idCardNo: true, name: true },
      });

      for (const apt of cleanResult.cleaned) {
        try {
          const patientId = matchPatientByKeys(apt, existingPatients);

          if (patientId) {
            await prisma.appointment.upsert({
              where: { appointmentNo: apt.appointmentNo || apt.hisAppointmentId || '' },
              create: {
                patientId,
                appointmentNo: apt.appointmentNo || apt.hisAppointmentId || '',
                appointmentDate: apt.appointmentDate ? new Date(apt.appointmentDate) : new Date(),
                appointmentType: apt.appointmentType,
                status: apt.status as any,
                doctor: apt.doctor,
                department: apt.department,
                source: source,
                hisAppointmentId: apt.hisAppointmentId,
                missedReason: apt.missedReason,
              },
              update: {
                appointmentType: apt.appointmentType,
                status: apt.status as any,
                doctor: apt.doctor,
                department: apt.department,
                missedReason: apt.missedReason,
              },
            });
            importedCount++;
          } else {
            failedCount++;
          }
        } catch (e) {
          failedCount++;
          console.error('导入预约失败:', e);
        }
      }
    } else if (dataType === 'charge') {
      cleanResult = cleanChargeData(rawData as RawChargeData[]);

      const existingPatients = await prisma.patient.findMany({
        select: { id: true, patientNo: true, hisPatientId: true, idCardNo: true, name: true },
      });

      for (const charge of cleanResult.cleaned) {
        try {
          const patientId = matchPatientByKeys(charge, existingPatients);

          if (patientId) {
            await prisma.chargeRecord.upsert({
              where: { chargeNo: charge.chargeNo || charge.hisChargeId || '' },
              create: {
                patientId,
                chargeNo: charge.chargeNo || charge.hisChargeId || '',
                chargeDate: charge.chargeDate ? new Date(charge.chargeDate) : new Date(),
                amount: charge.amount as any,
                itemName: charge.itemName || '',
                itemType: charge.itemType,
                paymentStatus: charge.paymentStatus as any,
                paymentMethod: charge.paymentMethod,
                source: source,
                hisChargeId: charge.hisChargeId,
              },
              update: {
                amount: charge.amount as any,
                itemName: charge.itemName,
                itemType: charge.itemType,
                paymentStatus: charge.paymentStatus as any,
                paymentMethod: charge.paymentMethod,
              },
            });
            importedCount++;
          } else {
            failedCount++;
          }
        } catch (e) {
          failedCount++;
          console.error('导入收费记录失败:', e);
        }
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: '不支持的数据类型: ' + dataType,
        },
        { status: 400 }
      );
    }

    await prisma.dataImportLog.create({
      data: {
        source: source as any,
        importType: dataType,
        recordsTotal: cleanResult.stats.total,
        recordsSuccess: importedCount,
        recordsFailed: failedCount + cleanResult.stats.invalid,
        recordsDuplicate: cleanResult.stats.duplicates,
        startTime: new Date(),
        endTime: new Date(),
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...cleanResult.stats,
        imported: importedCount,
        failed: failedCount,
      },
      message: '数据导入完成',
    });
  } catch (error) {
    console.error('数据导入失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '数据导入失败',
      },
      { status: 500 }
    );
  }
}
