from datetime import timedelta

from django.contrib.auth.models import User
from django.db.models import Count, Avg, F, ExpressionWrapper, FloatField, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import viewsets, status, permissions, parsers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import (
    TransferRecord, Quotation, FinanceDoc, VehicleProfile,
    FileAttachment, ExceptionItem, ExceptionNote, ReviewTag, UserProfile,
)
from .serializers import (
    TransferRecordListSerializer, TransferRecordDetailSerializer,
    TransferRecordCreateSerializer, TransferRecordUpdateSerializer,
    QuotationSerializer, QuotationCreateSerializer,
    FinanceDocSerializer, FinanceDocUpdateSerializer,
    VehicleProfileSerializer, VehicleProfileUpdateSerializer,
    FileAttachmentSerializer,
    ExceptionItemSerializer, ExceptionItemUpdateSerializer,
    ExceptionItemCreateSerializer,
    ExceptionNoteCreateSerializer,
    ReviewTagSerializer, ReviewTagCreateSerializer,
    AnalyticsOverviewSerializer,
    UserSummarySerializer,
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['user_id'] = user.id
        token['username'] = user.username
        try:
            token['role'] = user.profile.role
        except UserProfile.DoesNotExist:
            token['role'] = 'specialist'
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user_id'] = self.user.id
        data['username'] = self.user.username
        try:
            data['role'] = self.user.profile.role
        except UserProfile.DoesNotExist:
            data['role'] = 'specialist'
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class IsManagerOrFinance(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.profile.role in ('manager', 'finance')


class TransferRecordViewSet(viewsets.ModelViewSet):
    queryset = TransferRecord.objects.select_related('assignee__profile', 'reviewer__profile').prefetch_related('exception_items', 'review_tags').all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return TransferRecordListSerializer
        if self.action == 'create':
            return TransferRecordCreateSerializer
        if self.action in ('update', 'partial_update'):
            return TransferRecordUpdateSerializer
        return TransferRecordDetailSerializer

    def get_queryset(self):
        qs = TransferRecord.objects.select_related('assignee__profile', 'reviewer__profile').prefetch_related('review_tags').all()
        user_role = self.request.user.profile.role
        status_filter = self.request.query_params.get('status')
        assignee_filter = self.request.query_params.get('assignee')

        if user_role == 'specialist':
            qs = qs.filter(assignee=self.request.user)

        if status_filter:
            qs = qs.filter(status=status_filter)
        if assignee_filter:
            qs = qs.filter(assignee_id=assignee_filter)

        return qs.annotate(
            exception_count=Count(
                'exception_items',
                filter=~Q(exception_items__status__in=('closed', 'resolved')),
                distinct=True
            )
        )

    def perform_create(self, serializer):
        user_role = self.request.user.profile.role
        assignee = serializer.validated_data.get('assignee')
        if not assignee or user_role == 'specialist':
            assignee = self.request.user
        serializer.save(assignee=assignee)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        instance = TransferRecord.objects.select_related('assignee__profile', 'reviewer__profile').get(pk=serializer.instance.pk)
        output_serializer = TransferRecordDetailSerializer(instance, context={'request': request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def submit_review(self, request, pk=None):
        record = self.get_object()
        if record.status not in ('pending', 'exception'):
            return Response({'detail': '仅待处理或异常记录可提交复核'}, status=status.HTTP_400_BAD_REQUEST)
        record.status = 'review'
        record.save()
        serializer = TransferRecordDetailSerializer(record, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve_review(self, request, pk=None):
        record = self.get_object()
        if request.user.profile.role not in ('manager', 'finance'):
            return Response({'detail': '无权复核'}, status=status.HTTP_403_FORBIDDEN)
        if record.status != 'review':
            return Response({'detail': '仅待复核记录可审批'}, status=status.HTTP_400_BAD_REQUEST)
        record.status = 'completed'
        record.reviewer = request.user
        record.reviewed_at = timezone.now()
        record.review_note = request.data.get('review_note', '')
        record.save()
        serializer = TransferRecordDetailSerializer(record, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reject_review(self, request, pk=None):
        record = self.get_object()
        if request.user.profile.role not in ('manager', 'finance'):
            return Response({'detail': '无权复核'}, status=status.HTTP_403_FORBIDDEN)
        if record.status != 'review':
            return Response({'detail': '仅待复核记录可退回'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.data.get('review_note'):
            return Response({'detail': '退回必须填写原因'}, status=status.HTTP_400_BAD_REQUEST)
        record.status = 'pending'
        record.reviewer = request.user
        record.reviewed_at = timezone.now()
        record.review_note = request.data.get('review_note')
        record.save()
        serializer = TransferRecordDetailSerializer(record, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_tag(self, request, pk=None):
        record = self.get_object()
        tag_name = request.data.get('tag_name', '').strip()
        if not tag_name:
            return Response({'detail': '标签名不能为空'}, status=status.HTTP_400_BAD_REQUEST)
        tag, created = ReviewTag.objects.get_or_create(record=record, tag_name=tag_name)
        serializer = ReviewTagSerializer(tag)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def mark_exception(self, request, pk=None):
        record = self.get_object()
        missing_type = request.data.get('missing_type')
        urgency = request.data.get('urgency', 'medium')
        if not missing_type:
            return Response({'detail': '缺失类型不能为空'}, status=status.HTTP_400_BAD_REQUEST)
        valid_missing_types = [c[0] for c in ExceptionItem.MISSING_TYPE_CHOICES]
        if missing_type not in valid_missing_types:
            return Response({'detail': '无效的缺失类型'}, status=status.HTTP_400_BAD_REQUEST)
        exception_item = ExceptionItem.objects.create(
            record=record,
            missing_type=missing_type,
            urgency=urgency,
        )
        if record.status == 'pending':
            record.status = 'exception'
            record.save(update_fields=['status', 'updated_at'])
        serializer = ExceptionItemSerializer(exception_item, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'])
    def quotations(self, request, pk=None):
        record = self.get_object()
        if request.method == 'GET':
            quotations = record.quotations.select_related('quoted_by__profile').all()
            serializer = QuotationSerializer(quotations, many=True, context={'request': request})
            return Response(serializer.data)
        serializer = QuotationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quotation = Quotation.objects.create(
            record=record,
            price=serializer.validated_data['price'],
            note=serializer.validated_data.get('note', ''),
            quoted_by=request.user,
        )
        return Response(QuotationSerializer(quotation, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'patch'])
    def finance(self, request, pk=None):
        record = self.get_object()
        finance_doc, _ = FinanceDoc.objects.get_or_create(record=record)
        if request.method == 'GET':
            serializer = FinanceDocSerializer(finance_doc, context={'request': request})
            return Response(serializer.data)
        serializer = FinanceDocUpdateSerializer(finance_doc, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(FinanceDocSerializer(finance_doc, context={'request': request}).data)

    @action(detail=True, methods=['get', 'patch'])
    def vehicle(self, request, pk=None):
        record = self.get_object()
        vehicle, _ = VehicleProfile.objects.get_or_create(
            record=record,
            defaults={'brand': '未知', 'model': '未知', 'vin': f'TEMP-{record.id}'[:17]},
        )
        if request.method == 'GET':
            serializer = VehicleProfileSerializer(vehicle, context={'request': request})
            return Response(serializer.data)
        serializer = VehicleProfileUpdateSerializer(vehicle, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(VehicleProfileSerializer(vehicle, context={'request': request}).data)


class ExceptionItemViewSet(viewsets.ModelViewSet):
    queryset = ExceptionItem.objects.select_related('record', 'record__assignee__profile').prefetch_related('notes', 'notes__author__profile').all()
    serializer_class = ExceptionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user_role = self.request.user.profile.role
        if user_role == 'specialist':
            qs = qs.filter(record__assignee=self.request.user)
        status_filter = self.request.query_params.get('status')
        urgency_filter = self.request.query_params.get('urgency')
        missing_type_filter = self.request.query_params.get('missing_type')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if urgency_filter:
            qs = qs.filter(urgency=urgency_filter)
        if missing_type_filter:
            qs = qs.filter(missing_type=missing_type_filter)
        return qs

    def get_serializer_class(self):
        if self.action in ('update', 'partial_update'):
            return ExceptionItemUpdateSerializer
        return ExceptionItemSerializer

    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        item = self.get_object()
        serializer = ExceptionNoteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = ExceptionNote.objects.create(
            exception_item=item,
            author=request.user,
            content=serializer.validated_data['content'],
        )
        return Response(ExceptionItemSerializer(item, context={'request': request}).data, status=status.HTTP_201_CREATED)


class FileUploadView(viewsets.ViewSet):
    parser_classes = [parsers.MultiPartParser]
    permission_classes = [IsAuthenticated]

    def create(self, request):
        file = request.FILES.get('file')
        related_obj_id = request.data.get('related_obj_id')
        related_obj_type = request.data.get('related_obj_type')
        if not all([file, related_obj_id, related_obj_type]):
            return Response({'detail': '缺少必要参数'}, status=status.HTTP_400_BAD_REQUEST)
        attachment = FileAttachment.objects.create(
            content_type=file.content_type,
            file_name=file.name,
            file=file,
            file_size=file.size,
            related_obj_id=related_obj_id,
            related_obj_type=related_obj_type,
        )
        serializer = FileAttachmentSerializer(attachment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_overview(request):
    now = timezone.now()
    six_months_ago = now - timedelta(days=180)

    completed_records = TransferRecord.objects.filter(
        status='completed',
        reviewed_at__isnull=False,
        created_at__gte=six_months_ago,
    )

    avg_days = 0
    if completed_records.exists():
        avg_result = completed_records.annotate(
            duration=ExpressionWrapper(
                F('reviewed_at') - F('created_at'),
                output_field=FloatField(),
            )
        ).aggregate(avg_duration=Avg('duration'))
        avg_seconds = avg_result['avg_duration'].total_seconds() if avg_result['avg_duration'] else 0
        avg_days = round(avg_seconds / 86400, 1)

    trend = list(
        completed_records.annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(
            count=Count('id'),
            avg_days=Avg(
                ExpressionWrapper(
                    F('reviewed_at') - F('created_at'),
                    output_field=FloatField(),
                )
            ),
        )
        .order_by('month')
    )
    trend_data = []
    for t in trend:
        if t['month']:
            avg_s = t['avg_days'].total_seconds() if t['avg_days'] else 0
            trend_data.append({
                'month': t['month'].strftime('%Y-%m'),
                'avg_days': round(avg_s / 86400, 1),
            })

    channel_data = list(
        VehicleProfile.objects.filter(record__status='completed')
        .values('source_channel')
        .annotate(
            count=Count('id'),
            avg_days=Avg(
                ExpressionWrapper(
                    F('record__reviewed_at') - F('record__created_at'),
                    output_field=FloatField(),
                )
            ),
        )
        .order_by('-count')
    )
    channel_stats = []
    for c in channel_data:
        avg_s = c['avg_days'].total_seconds() if c['avg_days'] else 0
        channel_stats.append({
            'channel': c['source_channel'] or '未知',
            'count': c['count'],
            'avg_days': round(avg_s / 86400, 1),
        })

    assignee_data = list(
        TransferRecord.objects.filter(status='completed')
        .values('assignee')
        .annotate(
            count=Count('id'),
            avg_hours=Avg(
                ExpressionWrapper(
                    F('reviewed_at') - F('created_at'),
                    output_field=FloatField(),
                )
            ),
            exception_count=Count('exception_items', filter=~Q(exception_items__status='closed')),
            total_count=Count('exception_items'),
        )
    )
    assignee_stats = []
    for a in assignee_data:
        user = User.objects.filter(id=a['assignee']).first()
        if user:
            avg_s = a['avg_hours'].total_seconds() if a['avg_hours'] else 0
            exception_rate = round(a['exception_count'] / a['total_count'], 2) if a['total_count'] > 0 else 0
            assignee_stats.append({
                'assignee': UserSummarySerializer(user).data,
                'count': a['count'],
                'avg_hours': round(avg_s / 3600, 1),
                'exception_rate': exception_rate,
            })

    tag_data = list(
        ReviewTag.objects.values('tag_name')
        .annotate(count=Count('id'))
        .order_by('-count')[:20]
    )
    tag_cloud = [{'tag': t['tag_name'], 'count': t['count']} for t in tag_data]

    data = {
        'turnover_avg_days': avg_days,
        'turnover_trend': trend_data,
        'channel_stats': channel_stats,
        'assignee_stats': assignee_stats,
        'tag_cloud': tag_cloud,
    }
    serializer = AnalyticsOverviewSerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    role = user.profile.role
    pending_count = TransferRecord.objects.filter(status='pending').count() if role != 'specialist' else TransferRecord.objects.filter(status='pending', assignee=user).count()
    review_count = TransferRecord.objects.filter(status='review').count()
    exception_count = ExceptionItem.objects.filter(status__in=('open', 'reminded', 'escalated')).count()
    if role == 'specialist':
        exception_count = ExceptionItem.objects.filter(
            status__in=('open', 'reminded', 'escalated'),
            record__assignee=user
        ).count()
    completed_this_month = TransferRecord.objects.filter(
        status='completed',
        reviewed_at__month=timezone.now().month,
        reviewed_at__year=timezone.now().year,
    ).count()
    if role == 'specialist':
        completed_this_month = TransferRecord.objects.filter(
            status='completed',
            assignee=user,
            reviewed_at__month=timezone.now().month,
            reviewed_at__year=timezone.now().year,
        ).count()
    return Response({
        'pending_count': pending_count,
        'review_count': review_count,
        'exception_count': exception_count,
        'completed_this_month': completed_this_month,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    role_filter = request.query_params.get('role')
    qs = User.objects.select_related('profile').all().order_by('username')
    if role_filter:
        qs = qs.filter(profile__role=role_filter)
    serializer = UserSummarySerializer(qs, many=True)
    return Response(serializer.data)
