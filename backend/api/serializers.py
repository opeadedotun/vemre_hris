from rest_framework import serializers
from .models import User, Department, Employee, EmployeeKPI, PerformanceSummary, Appraisal, AuditLog, JobRole, KPITemplate, KPITemplateItem, AttendanceUpload, AttendanceLog, AttendanceSummary, SalaryStructure, PayrollRun, PayrollRecord, Branch

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'is_active')
        extra_kwargs = {
            'password': {'write_only': True}
        }

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
        extra_kwargs = {
            'employee_code': {'required': False, 'allow_blank': True}
        }

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
    records = PayrollRecordSerializer(many=True, read_only=True)

    class Meta:
        model = PayrollRun
        fields = '__all__'

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'
