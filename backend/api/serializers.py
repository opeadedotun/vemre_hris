from rest_framework import serializers
from .models import (
    User, Department, Employee, EmployeeKPI, PerformanceSummary, Appraisal,
    AuditLog, JobRole, KPITemplate, KPITemplateItem, AttendanceUpload,
    AttendanceLog, AttendanceSummary, AttendanceMonthlySummary, SalaryStructure,
    PayrollRun, PayrollRecord, Branch, ExpenseCategory, Expense, LeaveType,
    LeaveRequest, Resignation, EmployeeDocument, HRTicket, TicketMessage,
    KnowledgeCategory, KnowledgeArticle, KnowledgeVersion, OnboardingGuide, OnboardingProgress,
    AIQueryLog, Channel, ChannelMember, Message
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'is_active', 'first_name')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    manager_name = serializers.ReadOnlyField(source='manager.full_name')
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = '__all__'
        extra_kwargs = {'employee_code': {'required': False, 'allow_blank': True}}

    def get_first_name(self, obj):
        return obj.full_name.split(' ')[0] if obj.full_name else ''

    def get_last_name(self, obj):
        parts = obj.full_name.split(' ')
        return ' '.join(parts[1:]) if len(parts) > 1 else ''


class KPITemplateItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = KPITemplateItem
        fields = '__all__'


class KPITemplateSerializer(serializers.ModelSerializer):
    items = KPITemplateItemSerializer(many=True, read_only=True)
    job_role_name = serializers.ReadOnlyField(source='job_role.name')

    class Meta:
        model = KPITemplate
        fields = '__all__'


class EmployeeKPISerializer(serializers.ModelSerializer):
    kpi_name = serializers.ReadOnlyField(source='template_item.kpi_name')
    weight_points = serializers.ReadOnlyField(source='template_item.weight_points')

    class Meta:
        model = EmployeeKPI
        fields = '__all__'


class PerformanceSummarySerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    department_name = serializers.ReadOnlyField(source='employee.department.name')

    class Meta:
        model = PerformanceSummary
        fields = '__all__'


class AppraisalSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    reviewer_name = serializers.ReadOnlyField(source='reviewer.username')

    class Meta:
        model = Appraisal
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = AuditLog
        fields = '__all__'


class JobRoleSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = JobRole
        fields = '__all__'


class AttendanceUploadSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.ReadOnlyField(source='uploaded_by.username')

    class Meta:
        model = AttendanceUpload
        fields = '__all__'


class AttendanceLogSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = AttendanceLog
        fields = '__all__'


class AttendanceSummarySerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')

    class Meta:
        model = AttendanceSummary
        fields = '__all__'


class AttendanceMonthlySummarySerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')

    class Meta:
        model = AttendanceMonthlySummary
        fields = '__all__'


class SalaryStructureSerializer(serializers.ModelSerializer):
    job_role_name = serializers.ReadOnlyField(source='job_role.name')

    class Meta:
        model = SalaryStructure
        fields = '__all__'


class PayrollRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    employee_code = serializers.ReadOnlyField(source='employee.employee_code')
    job_title = serializers.ReadOnlyField(source='employee.job_title')
    department_name = serializers.ReadOnlyField(source='employee.department.name')
    passport = serializers.ImageField(source='employee.passport', read_only=True)

    class Meta:
        model = PayrollRecord
        fields = '__all__'


class PayrollRunSerializer(serializers.ModelSerializer):
    processed_by_name = serializers.ReadOnlyField(source='processed_by.username')
    records = serializers.SerializerMethodField()

    class Meta:
        model = PayrollRun
        fields = '__all__'

    def get_records(self, obj):
        qs = obj.records.all()
        employee = self.context.get('employee')
        if employee:
            qs = qs.filter(employee=employee)
        return PayrollRecordSerializer(qs, many=True, context=self.context).data


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = '__all__'


class ExpenseSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    category_name = serializers.ReadOnlyField(source='category.name')
    approved_by_name = serializers.ReadOnlyField(source='approved_by.username')
    reimbursed_by_name = serializers.ReadOnlyField(source='reimbursed_by.username')

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('employee',)


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = '__all__'


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    leave_type_name = serializers.ReadOnlyField(source='leave_type.name')
    approved_by_name = serializers.ReadOnlyField(source='approved_by.username')

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ('employee', 'approved_by', 'approved_at', 'status')


class ResignationSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    approved_by_name = serializers.ReadOnlyField(source='approved_by.username')

    class Meta:
        model = Resignation
        fields = '__all__'


class EmployeeDocumentSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    uploaded_by_name = serializers.ReadOnlyField(source='uploaded_by.username')

    class Meta:
        model = EmployeeDocument
        fields = '__all__'


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')

    class Meta:
        model = TicketMessage
        fields = '__all__'
        read_only_fields = ('ticket', 'sender')


class HRTicketSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.username')
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = HRTicket
        fields = '__all__'


class KnowledgeCategorySerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = KnowledgeCategory
        fields = '__all__'


class KnowledgeVersionSerializer(serializers.ModelSerializer):
    edited_by_name = serializers.ReadOnlyField(source='edited_by.username')

    class Meta:
        model = KnowledgeVersion
        fields = '__all__'


class KnowledgeArticleSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    created_by_name = serializers.ReadOnlyField(source='created_by.username')
    versions = KnowledgeVersionSerializer(many=True, read_only=True)

    class Meta:
        model = KnowledgeArticle
        fields = '__all__'
        extra_kwargs = {'slug': {'required': False, 'allow_blank': True}}


class OnboardingGuideSerializer(serializers.ModelSerializer):
    job_role_name = serializers.ReadOnlyField(source='job_role.name')

    class Meta:
        model = OnboardingGuide
        fields = '__all__'


class OnboardingProgressSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    guide_title = serializers.ReadOnlyField(source='guide.title')
    guide_content = serializers.ReadOnlyField(source='guide.content')
    checklist = serializers.ReadOnlyField(source='guide.checklist_json')

    class Meta:
        model = OnboardingProgress
        fields = '__all__'


class AIQueryLogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = AIQueryLog
        fields = '__all__'


class ChannelMemberSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = ChannelMember
        fields = '__all__'


class ChannelSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.username')
    department_name = serializers.ReadOnlyField(source='department.name')
    member_count = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Channel
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')

    def get_member_count(self, obj):
        return obj.members.count()

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        membership = obj.members.filter(user=request.user).first()
        if not membership or not membership.last_read_at:
            return obj.messages.count()
        return obj.messages.filter(created_at__gt=membership.last_read_at).count()

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if not msg:
            return None
        return {
            'text': msg.message_text[:80],
            'sender': msg.sender.username if msg.sender else 'System',
            'created_at': msg.created_at.isoformat()
        }


class ChannelMemberDetailSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    full_name = serializers.ReadOnlyField(source='user.first_name')

    class Meta:
        model = ChannelMember
        fields = ('id', 'user', 'username', 'full_name', 'role', 'joined_at')


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.first_name')
    sender_username = serializers.ReadOnlyField(source='sender.username')
    sender_passport = serializers.SerializerMethodField()
    content = serializers.CharField(source='message_text')
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            'id', 'channel', 'sender', 'sender_name', 'sender_username', 'sender_passport',
            'content', 'file_attachment', 'file_url', 'is_edited', 'reactions', 'created_at', 'updated_at'
        )
        read_only_fields = ('sender', 'is_edited', 'reactions', 'created_at', 'updated_at')

    def get_file_url(self, obj):
        if obj.file_attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file_attachment.url)
            return obj.file_attachment.url
        return None

    def get_sender_passport(self, obj):
        if not obj.sender:
            return None
        emp = Employee.objects.filter(email=obj.sender.email).first()
        if not emp or not emp.passport:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(emp.passport.url)
        return emp.passport.url



