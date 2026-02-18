import pandas as pd
from datetime import datetime, time, timedelta
from decimal import Decimal
import os
from django.conf import settings

class AttendanceEngine:
    NAME_KEYS = ["name", "employee", "emp", "userid", "id", "full name"]
    DATE_KEYS = ["date", "day", "attendance date"]
    TIME_KEYS = ["time", "timestamp", "clock"]
    IN_KEYS = ["in", "checkin", "check-in", "entrance"]
    OUT_KEYS = ["out", "checkout", "check-out", "exit"]

    @staticmethod
    def normalize_column_name(col):
        return str(col).lower().strip().replace("_", " ").replace("-", " ")

    def auto_detect_columns(self, df):
        cols = {c: self.normalize_column_name(c) for c in df.columns}
        mapping = {}

        for col, norm in cols.items():
            if any(k in norm for k in self.NAME_KEYS):
                mapping["employee"] = col
            elif any(k in norm for k in self.DATE_KEYS):
                mapping["date"] = col
            elif any(k in norm for k in self.TIME_KEYS):
                mapping["time"] = col
            elif any(k in norm for k in self.IN_KEYS):
                mapping["check_in"] = col
            elif any(k in norm for k in self.OUT_KEYS):
                mapping["check_out"] = col
        
        return mapping

    def parse_file(self, file_path, branch_id, month):
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)

        mapping = self.auto_detect_columns(df)
        
        # Check if basic columns exist
        required = ["employee", "date"]
        if not all(r in mapping for r in required):
            raise ValueError(f"Could not auto-detect required columns. Found mapping: {mapping}")

        results = []
        
        # Group by employee and date
        # If check_in/check_out columns don't exist, we look for 'time' and find min/max
        emp_col = mapping["employee"]
        date_col = mapping["date"]

        for (emp_name, date_val), group in df.groupby([emp_col, date_col]):
            check_in = None
            check_out = None

            if "check_in" in mapping and "check_out" in mapping:
                check_in_raw = group[mapping["check_in"]].iloc[0]
                check_out_raw = group[mapping["check_out"]].iloc[0]
                check_in = self.parse_time(check_in_raw)
                check_out = self.parse_time(check_out_raw)
            elif "time" in mapping:
                times = group[mapping["time"]].dropna()
                if not times.empty:
                    check_in = self.parse_time(times.min())
                    check_out = self.parse_time(times.max())
            
            # Normalize date
            date = self.parse_date(date_val)
            
            results.append({
                "employee_raw": emp_name,
                "date": date,
                "check_in": check_in,
                "check_out": check_out,
                "branch_id": branch_id
            })
            
        return results

    def parse_time(self, val):
        if pd.isna(val): return None
        if isinstance(val, time): return val
        if isinstance(val, datetime): return val.time()
        
        str_val = str(val).strip()
        for fmt in ["%H:%M:%S", "%H:%M", "%I:%M %p", "%I:%M%p"]:
            try:
                return datetime.strptime(str_val, fmt).time()
            except ValueError:
                continue
        return None

    def parse_date(self, val):
        if pd.isna(val): return None
        if isinstance(val, datetime): return val.date()
        
        str_val = str(val).strip()
        for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"]:
            try:
                return datetime.strptime(str_val, fmt).date()
            except ValueError:
                continue
        return None

    def classify_lateness(self, check_in, expected_start):
        if not check_in or not expected_start:
            return 0, "IGNORE"
            
        ci_mins = check_in.hour * 60 + check_in.minute
        es_mins = expected_start.hour * 60 + expected_start.minute
        
        late_minutes = max(0, ci_mins - es_mins)
        
        if late_minutes <= 5:
            category = "IGNORE"
        elif late_minutes <= 30:
            category = "LATE_30"
        elif late_minutes <= 60:
            category = "LATE_1HR"
        else:
            category = "QUERY"
            
        return late_minutes, category

    def match_employee(self, raw_name, employees):
        """
        Matches employee using Surname and potential designation clues.
        employees: queryset or list of Employee objects.
        """
        raw_name = str(raw_name).lower().strip()
        parts = raw_name.split()
        if not parts: return None

        # Try to find by Surname (assuming last or first part might be surname)
        potential_matches = []
        for emp in employees:
            full_name_lower = emp.full_name.lower()
            # If the raw name is a subset or contains surname
            if all(p in full_name_lower for p in parts):
                potential_matches.append(emp)
        
        if len(potential_matches) == 1:
            return potential_matches[0]
            
        # If multiple, try to narrow down by role if possible (would need role clues in raw_name)
        # For now, return the first or None
        return potential_matches[0] if potential_matches else None
