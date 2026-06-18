from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg, Q, F, Case, When, IntegerField
from django.db.models.functions import TruncMonth, TruncDay, ExtractWeek
from django.utils import timezone
from datetime import timedelta
from apps.vehicles.models import Vehicle, VehicleStatus, DocumentType
from apps.inspections.models import InspectionReport
from apps.preparations.models import PreparationOrder
from apps.testdrives.models import TestDriveRecord
from apps.documents.models import VehicleDocument
from apps.users.permissions import IsManager, IsAppraiserOrManager


class StatisticsViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['overview', 'inventory_turnover', 'stage_distribution',
                           'document_completion', 'trend_data']:
            return [IsAuthenticated()]
        return [IsManager()]

    @action(detail=False, methods=['get'])
    def overview(self, request):
        now = timezone.now()
        today = now.date()
        this_month = now.replace(day=1)

        total_vehicles = Vehicle.objects.count()
        listed_vehicles = Vehicle.objects.filter(status=VehicleStatus.LISTED).count()
        sold_vehicles = Vehicle.objects.filter(status=VehicleStatus.SOLD).count()
        pending_review = Vehicle.objects.filter(status=VehicleStatus.PENDING_REVIEW).count()

        total_cost = Vehicle.objects.filter(
            status__in=[VehicleStatus.LISTED, VehicleStatus.SOLD]
        ).aggregate(total=Sum('purchase_price'))['total'] or 0
        total_revenue = Vehicle.objects.filter(
            status=VehicleStatus.SOLD
        ).aggregate(total=Sum('selling_price'))['total'] or 0
        profit = total_revenue - total_cost

        sold_this_month = Vehicle.objects.filter(
            status=VehicleStatus.SOLD,
            sold_at__gte=this_month,
        ).count()
        listed_this_month = Vehicle.objects.filter(
            listed_at__gte=this_month,
        ).count()
        created_today = Vehicle.objects.filter(
            created_at__date=today,
        ).count()

        required_docs = [DocumentType.REGISTRATION_CERT, DocumentType.DRIVING_LICENSE, DocumentType.INSURANCE]
        vehicles_with_missing = Vehicle.objects.annotate(
            reg_count=Count('documents', filter=Q(documents__document_type=DocumentType.REGISTRATION_CERT)),
            lic_count=Count('documents', filter=Q(documents__document_type=DocumentType.DRIVING_LICENSE)),
            ins_count=Count('documents', filter=Q(documents__document_type=DocumentType.INSURANCE)),
        ).exclude(reg_count__gt=0, lic_count__gt=0, ins_count__gt=0).count()

        inventory_vehicles = Vehicle.objects.filter(
            status__in=[VehicleStatus.PENDING_EVALUATION, VehicleStatus.PENDING_INSPECTION,
                          VehicleStatus.PENDING_PREPARATION, VehicleStatus.PENDING_TESTDRIVE,
                          VehicleStatus.PENDING_REVIEW, VehicleStatus.LISTED]
        )
        avg_inventory_days = 0
        if inventory_vehicles.exists():
            days_list = []
            for v in inventory_vehicles:
                days_list.append((now - v.created_at).days)
            avg_inventory_days = round(sum(days_list) / len(days_list), 1)

        return Response({
            'total_vehicles': total_vehicles,
            'listed_vehicles': listed_vehicles,
            'sold_vehicles': sold_vehicles,
            'pending_review': pending_review,
            'vehicles_with_missing_docs': vehicles_with_missing,
            'total_cost': float(total_cost),
            'total_revenue': float(total_revenue),
            'profit': float(profit),
            'profit_margin': round(float(profit / total_cost * 100), 2) if total_cost else 0,
            'avg_inventory_days': avg_inventory_days,
            'sold_this_month': sold_this_month,
            'listed_this_month': listed_this_month,
            'created_today': created_today,
        })

    @action(detail=False, methods=['get'], url_path='inventory-turnover')
    def inventory_turnover(self, request):
        days = int(request.GET.get('days', 90))
        start_date = (timezone.now() - timedelta(days=days)).date()

        inventory_data = []
        sold_vehicles = Vehicle.objects.filter(
            status=VehicleStatus.SOLD,
            sold_at__gte=start_date,
        ).order_by('sold_at')

        total_sold = sold_vehicles.count()
        total_profit = 0
        total_cost = 0
        inventory_days_list = []

        for v in sold_vehicles:
            inv_days = (v.sold_at.date() - v.created_at.date()).days if v.sold_at else 0
            inventory_days_list.append(inv_days)
            total_cost += float(v.purchase_price or 0)
            profit = float((v.selling_price or 0) - (v.purchase_price or 0))
            total_profit += profit
            inventory_data.append({
                'id': v.id,
                'vin': v.vin,
                'brand': v.brand,
                'model': v.model,
                'year': v.year,
                'plate_number': v.plate_number,
                'purchase_price': float(v.purchase_price or 0),
                'selling_price': float(v.selling_price or 0),
                'profit': profit,
                'profit_rate': round(profit / float(v.purchase_price) * 100, 2) if v.purchase_price else 0,
                'inventory_days': inv_days,
                'created_at': v.created_at.date().isoformat(),
                'sold_at': v.sold_at.date().isoformat(),
                'salesperson': v.salesperson.username if v.salesperson else '',
            })

        avg_days = round(sum(inventory_days_list) / len(inventory_days_list), 1) if inventory_days_list else 0
        median_days = sorted(inventory_days_list)[len(inventory_days_list) // 2] if inventory_days_list else 0

        return Response({
            'period_days': days,
            'total_sold': total_sold,
            'total_cost': total_cost,
            'total_profit': total_profit,
            'avg_profit': round(total_profit / total_sold, 2) if total_sold else 0,
            'avg_inventory_days': avg_days,
            'median_inventory_days': median_days,
            'fastest_days': min(inventory_days_list) if inventory_days_list else 0,
            'slowest_days': max(inventory_days_list) if inventory_days_list else 0,
            'details': inventory_data,
        })

    @action(detail=False, methods=['get'], url_path='stage-distribution')
    def stage_distribution(self, request):
        stages = [
            ('pending_evaluation', '待评估'),
            ('pending_inspection', '待检测'),
            ('pending_preparation', '待整备'),
            ('pending_testdrive', '待试驾'),
            ('pending_review', '待审核'),
            ('listed', '已上架'),
            ('sold', '已售出'),
            ('off_shelf', '已下架'),
            ('rejected', '审核驳回'),
        ]
        result = []
        for s, label in stages:
            count = Vehicle.objects.filter(status=s).count()
            result.append({
                'status': s,
                'label': label,
                'count': count,
            })

        required_docs = [DocumentType.REGISTRATION_CERT, DocumentType.DRIVING_LICENSE, DocumentType.INSURANCE]
        doc_stats = {}
        for doc_type in required_docs:
            doc_stats[doc_type] = VehicleDocument.objects.filter(document_type=doc_type).count()

        return Response({
            'vehicle_stages': result,
            'doc_counts': doc_stats,
            'inspection_total': InspectionReport.objects.count(),
            'inspection_verified': InspectionReport.objects.filter(verified=True).count(),
            'prep_total': PreparationOrder.objects.count(),
            'prep_completed': PreparationOrder.objects.filter(status='completed').count(),
            'testdrive_total': TestDriveRecord.objects.count(),
            'testdrive_completed': TestDriveRecord.objects.filter(status='completed').count(),
        })

    @action(detail=False, methods=['get'], url_path='document-completion')
    def document_completion(self, request):
        vehicles = Vehicle.objects.all()
        required = [
            (DocumentType.REGISTRATION_CERT, '登记证书'),
            (DocumentType.DRIVING_LICENSE, '行驶证'),
            (DocumentType.INSURANCE, '保险单'),
        ]

        completion_data = []
        for v in vehicles:
            existed = set(v.documents.values_list('document_type', flat=True))
            missing = [label for t, label in required if t not in existed]
            completion_data.append({
                'id': v.id,
                'vin': v.vin,
                'brand': v.brand,
                'model': v.model,
                'status': v.status,
                'status_display': v.get_status_display(),
                'missing_count': len(missing),
                'missing_types': missing,
                'documents_count': v.documents.count(),
                'created_at': v.created_at.date().isoformat(),
            })
        completion_data.sort(key=lambda x: -x['missing_count'])

        return Response({
            'total': len(completion_data),
            'complete_count': sum(1 for d in completion_data if d['missing_count'] == 0),
            'incomplete_count': sum(1 for d in completion_data if d['missing_count'] > 0),
            'complete_rate': round(sum(1 for d in completion_data if d['missing_count'] == 0) / len(completion_data) * 100, 2) if completion_data else 0,
            'details': completion_data[:100],
        })

    @action(detail=False, methods=['get'], url_path='trend-data')
    def trend_data(self, request):
        months = int(request.GET.get('months', 6))
        today = timezone.now().date()
        result = []

        for i in range(months - 1, -1, -1):
            month_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            if month_start.month == 12:
                next_month = month_start.replace(year=month_start.year + 1, month=1)
            else:
                next_month = month_start.replace(month=month_start.month + 1)

            label = f'{month_start.year}-{month_start.month:02d}'
            created = Vehicle.objects.filter(
                created_at__gte=month_start,
                created_at__lt=next_month,
            ).count()
            listed = Vehicle.objects.filter(
                listed_at__gte=month_start,
                listed_at__lt=next_month,
            ).count()
            sold = Vehicle.objects.filter(
                status=VehicleStatus.SOLD,
                sold_at__gte=month_start,
                sold_at__lt=next_month,
            ).count()
            sold_revenue = Vehicle.objects.filter(
                status=VehicleStatus.SOLD,
                sold_at__gte=month_start,
                sold_at__lt=next_month,
            ).aggregate(total=Sum('selling_price'))['total'] or 0

            result.append({
                'month': label,
                'created': created,
                'listed': listed,
                'sold': sold,
                'revenue': float(sold_revenue),
            })

        return Response(result)

    @action(detail=False, methods=['get'], url_path='staff-performance')
    def staff_performance(self, request):
        from django.contrib.auth import get_user_model
        from apps.users.models import Role
        User = get_user_model()

        result = {
            'appraisers': [],
            'sales': [],
            'finance': [],
            'managers': [],
        }

        for role, key in [(Role.APPRAISER, 'appraisers'), (Role.SALES, 'sales'),
                           (Role.FINANCE, 'finance'), (Role.MANAGER, 'managers')]:
            users = User.objects.filter(role=role, is_active=True)
            for u in users:
                data = {
                    'id': u.id,
                    'username': u.username,
                    'name': f'{u.first_name}{u.last_name}',
                }
                if role == Role.APPRAISER:
                    data['appraised_count'] = Vehicle.objects.filter(appraiser=u).count()
                    data['avg_price'] = float(
                        Vehicle.objects.filter(appraiser=u).aggregate(
                            avg=Avg('purchase_price')
                        )['avg'] or 0
                    )
                elif role == Role.SALES:
                    sold_qs = Vehicle.objects.filter(salesperson=u, status=VehicleStatus.SOLD)
                    data['sold_count'] = sold_qs.count()
                    data['total_revenue'] = float(sold_qs.aggregate(total=Sum('selling_price'))['total'] or 0)
                    data['testdrive_count'] = TestDriveRecord.objects.filter(salesperson=u).count()
                elif role == Role.FINANCE:
                    data['uploaded_docs'] = VehicleDocument.objects.filter(uploaded_by=u).count()
                result[key].append(data)

        return Response(result)

    @action(detail=False, methods=['get'], url_path='vehicle-trace')
    def vehicle_trace(self, request):
        vehicle_id = request.GET.get('vehicle_id')
        if not vehicle_id:
            return Response({'detail': '需要 vehicle_id 参数'}, status=400)
        try:
            vehicle = Vehicle.objects.select_related(
                'appraiser', 'salesperson', 'created_by'
            ).get(id=vehicle_id)
        except Vehicle.DoesNotExist:
            return Response({'detail': '车源不存在'}, status=404)

        timeline = []
        timeline.append({
            'type': 'create',
            'time': vehicle.created_at,
            'time_display': vehicle.created_at.strftime('%Y-%m-%d %H:%M'),
            'title': '创建车源档案',
            'operator': vehicle.created_by.username if vehicle.created_by else '系统',
            'detail': f'{vehicle.brand} {vehicle.model} 年款{vehicle.year}',
        })

        for log in vehicle.status_logs.select_related('operator').order_by('created_at'):
            timeline.append({
                'type': 'status',
                'time': log.created_at,
                'time_display': log.created_at.strftime('%Y-%m-%d %H:%M'),
                'title': f'状态变更：{log.get_from_status_display()} → {log.get_to_status_display()}',
                'operator': log.operator.username if log.operator else '系统',
                'detail': log.remark or '',
            })

        inspection = InspectionReport.objects.filter(vehicle=vehicle).first()
        if inspection:
            timeline.append({
                'type': 'inspection',
                'time': inspection.created_at,
                'time_display': inspection.created_at.strftime('%Y-%m-%d %H:%M'),
                'title': f'检测报告完成 - {inspection.report_no}',
                'operator': inspection.inspector.username if inspection.inspector else '',
                'detail': f'综合评级：{inspection.get_overall_rating_display() or "-"}',
            })

        for prep in vehicle.preparation_orders.all():
            timeline.append({
                'type': 'preparation',
                'time': prep.created_at,
                'time_display': prep.created_at.strftime('%Y-%m-%d %H:%M'),
                'title': f'整备工单 - {prep.order_no}',
                'operator': prep.handler.username if prep.handler else '',
                'detail': f'费用：¥{prep.actual_cost}',
            })

        for td in vehicle.testdrive_records.all():
            timeline.append({
                'type': 'testdrive',
                'time': td.created_at,
                'time_display': td.created_at.strftime('%Y-%m-%d %H:%M'),
                'title': f'试驾记录 - {td.record_no}',
                'operator': td.salesperson.username if td.salesperson else '',
                'detail': f'客户：{td.customer_name}，意向：{td.get_purchase_intent_display() or "-"}',
            })

        for rr in vehicle.review_records.all():
            timeline.append({
                'type': 'review',
                'time': rr.created_at,
                'time_display': rr.created_at.strftime('%Y-%m-%d %H:%M'),
                'title': f'复核：{rr.get_status_display()}',
                'operator': rr.reviewer.username if rr.reviewer else '',
                'detail': rr.comment or rr.conclusion or '',
            })

        for doc in vehicle.documents.all():
            timeline.append({
                'type': 'document',
                'time': doc.created_at,
                'time_display': doc.created_at.strftime('%Y-%m-%d %H:%M'),
                'title': f'上传文档：{doc.title}',
                'operator': doc.uploaded_by.username if doc.uploaded_by else '',
                'detail': f'{doc.get_source_display()} / {"已核验" if doc.is_verified else "待核验"}',
            })

        timeline.sort(key=lambda x: x['time'])

        return Response({
            'vehicle': {
                'id': vehicle.id,
                'vin': vehicle.vin,
                'brand': vehicle.brand,
                'model': vehicle.model,
                'year': vehicle.year,
                'status': vehicle.status,
                'status_display': vehicle.get_status_display(),
                'review_status': vehicle.review_status,
                'review_status_display': vehicle.get_review_status_display(),
            },
            'timeline': timeline,
            'documents_count': vehicle.documents.count(),
            'review_records_count': vehicle.review_records.count(),
        })
