from decimal import Decimal

def calculate_nigeria_tax_2026(monthly_income, pension=Decimal('0'), nhf=Decimal('0')):
    """
    Calculates Nigerian Personal Income Tax according to 2025/2026 rules.
    Assumes monthly_income is basic + all allowances.
    
    Bands (Annual):
    - First N800,000: 0%
    - Next N2,200,000 (up to 3M): 15%
    - Next N9,000,000 (up to 12M): 18%
    - Next N13,000,000 (up to 25M): 21%
    - Next N25,000,000 (up to 50M): 23%
    - Above N50,000,000: 25%
    """
    annual_income = monthly_income * Decimal('12')
    
    # Deductions (Pension, NHF are deductible)
    chargeable_income = max(Decimal('0'), annual_income - (pension + nhf) * Decimal('12'))
    
    tax = Decimal('0')
    
    # Band 1: First 800,000 @ 0%
    if chargeable_income <= 800000:
        return Decimal('0')
    
    chargeable_income -= 800000
    
    # Band 2: Next 2,200,000 @ 15%
    tier2 = min(chargeable_income, Decimal('2200000'))
    tax += tier2 * Decimal('0.15')
    chargeable_income -= tier2
    if chargeable_income <= 0: return tax / Decimal('12')
    
    # Band 3: Next 9,000,000 @ 18%
    tier3 = min(chargeable_income, Decimal('9000000'))
    tax += tier3 * Decimal('0.18')
    chargeable_income -= tier3
    if chargeable_income <= 0: return tax / Decimal('12')
    
    # Band 4: Next 13,000,000 @ 21%
    tier4 = min(chargeable_income, Decimal('13000000'))
    tax += tier4 * Decimal('0.21')
    chargeable_income -= tier4
    if chargeable_income <= 0: return tax / Decimal('12')
    
    # Band 5: Next 25,000,000 @ 23%
    tier5 = min(chargeable_income, Decimal('25000000'))
    tax += tier5 * Decimal('0.23')
    chargeable_income -= tier5
    if chargeable_income <= 0: return tax / Decimal('12')
    
    # Band 6: Above 50,000,000 @ 25%
    tax += chargeable_income * Decimal('0.25')
    
    return tax / Decimal('12')
