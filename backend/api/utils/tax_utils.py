from decimal import Decimal

def calculate_nigerian_tax(gross_income, pension_deduction=Decimal('0.00'), nhf_deduction=Decimal('0.00')):
    """
    Calculates Nigerian PAYE tax according to 2026 rules.
    - First N800,000: 0%
    - Next N2,200,000 (800k - 3M): 15%
    - Next N9,000,000 (3M - 12M): 18%
    - Next N13,000,000 (12M - 25M): 21%
    - Next N25,000,000 (25M - 50M): 23%
    - Above 50M: 25%
    """
    gross_income = Decimal(str(gross_income))
    pension_deduction = Decimal(str(pension_deduction))
    nhf_deduction = Decimal(str(nhf_deduction))
    
    annual_gross = gross_income * Decimal('12')
    chargeable_income = max(Decimal('0'), annual_gross - (pension_deduction + nhf_deduction) * Decimal('12'))
    
    if chargeable_income <= 800000:
        return Decimal('0.00')
        
    tax = Decimal('0.00')
    remaining = chargeable_income
    
    # Band 1: First 800,000 @ 0%
    remaining -= 800000
    
    # Band 2: Next 2,200,000 @ 15%
    tier2 = min(remaining, Decimal('2200000'))
    tax += tier2 * Decimal('0.15')
    remaining -= tier2
    if remaining <= 0: return (tax / Decimal('12')).quantize(Decimal('0.01'))
    
    # Band 3: Next 9,000,000 @ 18%
    tier3 = min(remaining, Decimal('9000000'))
    tax += tier3 * Decimal('0.18')
    remaining -= tier3
    if remaining <= 0: return (tax / Decimal('12')).quantize(Decimal('0.01'))
    
    # Band 4: Next 13,000,000 @ 21%
    tier4 = min(remaining, Decimal('13000000'))
    tax += tier4 * Decimal('0.21')
    remaining -= tier4
    if remaining <= 0: return (tax / Decimal('12')).quantize(Decimal('0.01'))
    
    # Band 5: Next 25,000,000 @ 23%
    tier5 = min(remaining, Decimal('25000000'))
    tax += tier5 * Decimal('0.23')
    remaining -= tier5
    if remaining <= 0: return (tax / Decimal('12')).quantize(Decimal('0.01'))
    
    # Band 6: Above 50,000,000 @ 25%
    tax += remaining * Decimal('0.25')
    
    return (tax / Decimal('12')).quantize(Decimal('0.01'))

def calculate_pension(basic, housing, transport):
    """8% of Basic + Housing + Transport"""
    return ((Decimal(str(basic)) + Decimal(str(housing)) + Decimal(str(transport))) * Decimal('0.08')).quantize(Decimal('0.01'))

def calculate_nhf(basic):
    """2.5% of Basic"""
    return (Decimal(str(basic)) * Decimal('0.025')).quantize(Decimal('0.01'))
