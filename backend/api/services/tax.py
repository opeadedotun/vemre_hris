"""
Nigeria Tax Act 2025 - Personal Income Tax Calculator

Key changes from the NTA 2025:
- Consolidated Relief Allowance (CRA) is abolished.
- Tax-free threshold: First N800,000 annual income (N66,666.67/month) is exempt.
- New graduated tax bands apply to taxable income above the threshold.
"""
from decimal import Decimal, ROUND_HALF_UP

# Annual tax-free threshold
TAX_FREE_THRESHOLD = Decimal('800000.00')

# Graduated tax bands (annual amounts, rates)
TAX_BANDS = [
    (Decimal('300000.00'), Decimal('0.07')),    # Next N300k at 7%
    (Decimal('300000.00'), Decimal('0.11')),    # Next N300k at 11%
    (Decimal('500000.00'), Decimal('0.15')),    # Next N500k at 15%
    (Decimal('500000.00'), Decimal('0.19')),    # Next N500k at 19%
    (Decimal('1600000.00'), Decimal('0.21')),   # Next N1.6M at 21%
    (None, Decimal('0.24')),                     # Above N3.5M at 24%
]


def calculate_annual_tax(annual_gross: Decimal) -> Decimal:
    """
    Calculate annual Personal Income Tax under the Nigeria Tax Act 2025.
    
    Args:
        annual_gross: Total annual gross income (basic + all allowances)
    
    Returns:
        Annual tax liability (Decimal)
    """
    if annual_gross <= TAX_FREE_THRESHOLD:
        return Decimal('0.00')
    
    taxable_income = annual_gross - TAX_FREE_THRESHOLD
    total_tax = Decimal('0.00')
    
    for band_limit, rate in TAX_BANDS:
        if taxable_income <= 0:
            break
        
        if band_limit is None:
            # Last band, no upper limit
            total_tax += taxable_income * rate
            taxable_income = Decimal('0.00')
        else:
            taxable_in_band = min(taxable_income, band_limit)
            total_tax += taxable_in_band * rate
            taxable_income -= taxable_in_band
    
    return total_tax.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def calculate_monthly_tax(monthly_gross: Decimal) -> Decimal:
    """
    Calculate monthly PAYE tax by annualizing, computing, then dividing by 12.
    
    Args:
        monthly_gross: Total monthly gross income
    
    Returns:
        Monthly tax deduction (Decimal)
    """
    annual_gross = monthly_gross * 12
    annual_tax = calculate_annual_tax(annual_gross)
    monthly_tax = annual_tax / 12
    return monthly_tax.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
