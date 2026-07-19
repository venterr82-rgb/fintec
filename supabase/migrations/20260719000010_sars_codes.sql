-- ============================================================
-- SARS SOURCE CODES — 2026 Year of Assessment
-- Only codes currently valid for 2026 returns
-- Deprecated/ancient codes excluded
-- Source: PAYE-AE-06-G06 Rev 13, effective 19 September 2025
-- ============================================================

create table if not exists sars_codes (
  code        text primary key,
  description text not null,
  category    text not null check (category in (
    'Normal Income', 'Allowance', 'Fringe Benefit',
    'Lump Sum', 'Gross Remuneration', 'Deduction',
    'Employees Tax', 'Other Income'
  )),
  taxable     boolean default true,
  notes       text,
  sort_order  integer default 0
);

-- Enable RLS
alter table sars_codes enable row level security;

-- All authenticated users can read (it's reference data)
create policy "SARS codes: authenticated read"
  on sars_codes for select
  to authenticated
  using (true);

-- Only service role can modify
create policy "SARS codes: service role write"
  on sars_codes for all
  to authenticated
  using (false);

-- ============================================================
-- NORMAL INCOME CODES
-- ============================================================
insert into sars_codes (code, description, category, taxable, notes, sort_order) values

('3601', 'Income — salary/wages (Subject to PAYE)',
  'Normal Income', true,
  'Main employment income. Includes salary, wages, backdated salary. Use for director remuneration from 2019 onwards.',
  100),

('3602', 'Income — non-taxable',
  'Normal Income', false,
  'Non-taxable income excluding foreign service remuneration. Capital payments, non-taxable allowances.',
  101),

('3603', 'Pension (Subject to PAYE)',
  'Normal Income', true,
  'Compulsory pension or qualifying purchased annuity from pension/preservation fund. Valid from 2013. Directive may be issued from 2026.',
  102),

('3605', 'Annual payment — bonus/incentive (Subject to PAYE)',
  'Normal Income', true,
  'Annual bonus, incentive bonus, leave pay on resignation, merit awards.',
  103),

('3606', 'Commission (Subject to PAYE)',
  'Normal Income', true,
  'Commission defined as an annual payment.',
  104),

('3607', 'Overtime (Subject to PAYE)',
  'Normal Income', true,
  'Overtime pay. Applicable prior to 2010 and from 2020 onwards.',
  105),

('3608', 'Arbitration award — taxable (Subject to PAYE)',
  'Normal Income', true,
  'Taxable portion of settlement agreement from employer/employee dispute.',
  106),

('3610', 'Annuity from Retirement Annuity Fund (Subject to PAYE)',
  'Normal Income', true,
  'Annuity from RAF or compulsory purchased annuity from long-term insurer. Valid from 2013. Directive may be issued from 2026.',
  107),

('3611', 'Purchased annuity — taxable (Subject to PAYE)',
  'Normal Income', true,
  'Taxable portion of purchased annuity from long-term insurer (not retirement fund).',
  108),

('3613', 'Restraint of trade (Subject to PAYE)',
  'Normal Income', true,
  'Restraint of trade amount paid by virtue of employment or holding office.',
  109),

('3616', 'Independent contractors (Subject to PAYE)',
  'Normal Income', true,
  'Remuneration paid to independent contractor.',
  110),

('3618', 'Annuity from Provident/Provident Preservation Fund (PAYE)',
  'Normal Income', true,
  'Qualifying annuity from provident or provident preservation fund. Applicable from 2021.',
  111),

('3620', 'NED Directors Fees / Audit Committee — RSA Resident (IT)',
  'Normal Income', true,
  'Directors fees or Audit Committee fees for RSA Non-Executive Director with voluntary PAYE. Applicable from 2018.',
  112),

('3621', 'Directors Fees — Non-Resident NED (PAYE)',
  'Normal Income', true,
  'Directors remuneration from RSA source by Non-Resident Non-Executive Director. Applicable from 2018.',
  113),

('3622', 'Long Service Cash Award',
  'Normal Income', true,
  'Long service award — initial 15 years unbroken service, subsequent 10-year periods. Valid from 2023.',
  114),

('3623', 'Antedated salary/pension extending over previous years (PAYE)',
  'Normal Income', true,
  'Taxable salary/pension accrued in previous years due to settlement or court order. Applicable from 2025.',
  115),

-- ============================================================
-- ALLOWANCE CODES
-- ============================================================

('3701', 'Travel allowance (Subject to PAYE)',
  'Allowance', true,
  'Travel allowance or advance for business travel, including fixed travel allowances and fuel cards. 100% must be specified.',
  200),

('3702', 'Reimbursive travel allowance (IT)',
  'Allowance', true,
  'Where reimbursement rate EXCEEDS the prescribed rate per km. From 2019 no business km limit.',
  201),

('3704', 'Subsistence allowance — local travel (IT)',
  'Allowance', true,
  'Allowance for meals/incidentals for local travel EXCEEDING deemed amounts.',
  202),

('3713', 'Other allowances (Subject to PAYE)',
  'Allowance', true,
  'All other taxable allowances not listed separately. From 2010 includes codes 3706, 3710, 3711, 3712.',
  203),

('3714', 'Other allowances — non-taxable',
  'Allowance', false,
  'All non-taxable allowances. From 2010 includes codes 3705, 3709, 3716.',
  204),

('3717', 'Broad-based employee share plan (Subject to PAYE)',
  'Allowance', true,
  'Amount from disposal of qualifying equity share.',
  205),

('3718', 'Vesting of equity instruments / return of capital — restricted equity (PAYE)',
  'Allowance', true,
  'Vesting of equity instrument or return of capital re restricted equity instruments (s8C). Applicable from 2018.',
  206),

('3719', 'Dividends not exempt — par (dd) proviso s10(1)(k)(i) (PAYE)',
  'Allowance', true,
  'Dividends re restricted equity instruments (s8C). Applicable from 2018.',
  207),

('3720', 'Dividends not exempt — par (ii) proviso s10(1)(k)(i) (PAYE)',
  'Allowance', true,
  'Dividends received in respect of services rendered or office held. Applicable from 2018.',
  208),

('3721', 'Dividends not exempt — par (jj) proviso s10(1)(k)(i) (PAYE)',
  'Allowance', true,
  'Dividends re restricted equity instrument (s8C) derived from specific transactions. Applicable from 2018.',
  209),

('3722', 'Reimbursive travel allowance — excess portion',
  'Allowance', true,
  'Excess portion where reimbursement EXCEEDS prescribed rate. From 2019. Must accompany code 3702.',
  210),

('3723', 'Dividends not exempt — par (kk) s10(1)(k)(i) (PAYE)',
  'Allowance', true,
  'Dividends re restricted equity instruments (s8C). Applicable from 2018.',
  211),

-- ============================================================
-- FRINGE BENEFIT CODES
-- ============================================================

('3801', 'General fringe benefits (Subject to PAYE)',
  'Fringe Benefit', true,
  'All fringe benefits not listed separately. From 2010 includes codes 3803-3809. Excludes Long Service Award (use 3835).',
  300),

('3802', 'Use of motor vehicle — acquired by employer NOT via operating lease (PAYE)',
  'Fringe Benefit', true,
  'Taxable benefit for right of use of motor vehicle not under operating lease.',
  301),

('3810', 'Medical aid contributions (Subject to PAYE)',
  'Fringe Benefit', true,
  'Medical aid contributions paid on behalf of employee by employer.',
  302),

('3813', 'Medical services costs (Subject to PAYE)',
  'Fringe Benefit', true,
  'Medical costs incurred on behalf of employee — medical, dental, hospital, nursing.',
  303),

('3816', 'Use of motor vehicle — acquired via Operating Lease (PAYE)',
  'Fringe Benefit', true,
  'Taxable benefit for right of use of motor vehicle under operating lease. From 2014.',
  304),

('3817', 'Employers Pension Fund contributions (PAYE)',
  'Fringe Benefit', true,
  'Value of taxable benefit — employer pension fund contributions. From 2017.',
  305),

('3825', 'Employers Provident Fund contributions (PAYE)',
  'Fringe Benefit', true,
  'Value of taxable benefit — employer provident fund contributions. From 2017.',
  306),

('3828', 'Employees Debt: Employer paid Retirement Annuity Fund contributions (PAYE)',
  'Fringe Benefit', true,
  'Employer RA fund contributions paid on behalf of employee debt. From 2017.',
  307),

('3833', 'Benefit: Bargaining Council Employer Contributions (PAYE)',
  'Fringe Benefit', true,
  'Employer Bargaining Council contributions. From 2020. Amount must equal code 4584.',
  308),

('3835', 'Long Service Award — taxable benefit',
  'Fringe Benefit', true,
  'Long Service Award (non-cash). Full value before R5,000 exclusion. From 2023. Use with code 3622.',
  309),

-- ============================================================
-- LUMP SUM CODES (currently valid)
-- ============================================================

('3901', 'Gratuities / Severance Benefits (Subject to PAYE)',
  'Lump Sum', true,
  'Gratuities prior to 1 March 2011. Severance benefits after 1 March 2011 for employees 55+, permanently incapacitated, or retrenchment.',
  400),

('3915', 'Retirement / termination lump sum / Commutation of annuities (PAYE)',
  'Lump Sum', true,
  'Lump sums accruing after 1 October 2007 from pension/provident/RAF in respect of retirement or death.',
  401),

('3920', 'Lump sum withdrawal benefits (Subject to PAYE)',
  'Lump Sum', true,
  'Lump sums after 28 Feb 2009 from pension/provident/RAF for withdrawal (resignation, transfer, divorce, immigration, etc.).',
  402),

('3924', 'Transfer on retirement (PAYE)',
  'Lump Sum', true,
  'Transfer of retirement benefit before normal retirement date from Pension/Provident fund to RAF. From 2019.',
  403),

('3926', 'Savings withdrawal benefit (PAYE)',
  'Lump Sum', true,
  'Withdrawal from Retirement Fund Savings Component/Pot. From 2025.',
  404),

-- ============================================================
-- DEDUCTION CODES (applicable 2026)
-- ============================================================

('4001', 'Pension fund contributions (employee)',
  'Deduction', true,
  'Employee contributions to pension fund.',
  500),

('4002', 'Provident fund contributions (employee)',
  'Deduction', true,
  'Employee contributions to provident fund.',
  501),

('4003', 'Retirement annuity fund contributions (employee)',
  'Deduction', true,
  'Employee contributions to retirement annuity fund. From 2010 incorporates code 4004.',
  502),

('4005', 'Medical aid contributions (employee)',
  'Deduction', true,
  'Employee portion of medical aid contributions.',
  503),

('4006', 'Medical aid contributions — additional (employee)',
  'Deduction', true,
  'Additional employee medical aid contributions.',
  504),

('4024', 'Income protection / disability premiums',
  'Deduction', true,
  'Premiums for income protection or disability policies. From 2007.',
  505),

('4030', 'Loss of income policy premiums',
  'Deduction', true,
  'Premiums for loss of income policies. From 2010.',
  506),

('4042', 'Two-pot retirement fund — vested component contribution',
  'Deduction', true,
  'Applicable from 2026 year of assessment.',
  507),

('4472', 'Arrear pension fund contributions',
  'Deduction', true,
  'Arrear contributions to pension fund. From 2006–2009 and from 2017.',
  508),

('4473', 'Arrear RAF contributions',
  'Deduction', true,
  'Arrear contributions to retirement annuity fund. From 2017.',
  509),

('4474', 'Public benefit organisation donations',
  'Deduction', true,
  'Donations to approved PBOs (s18A).',
  510),

('4493', 'Wear and tear — home office',
  'Deduction', true,
  'Wear and tear allowance for home office assets.',
  511),

('4497', 'Home office expenses',
  'Deduction', true,
  'Apportioned home office expenses (rates, electricity, etc.).',
  512),

('4582', 'Pension fund contributions — employer (deduction)',
  'Deduction', true,
  'From 2017.',
  513),

('4583', 'Provident fund contributions — employer (deduction)',
  'Deduction', true,
  'From 2017.',
  514),

('4584', 'Bargaining Council contributions (deduction)',
  'Deduction', true,
  'Must equal code 3833. From 2017.',
  515),

('4585', 'RAF contributions — employer (deduction)',
  'Deduction', true,
  'From 2017.',
  516),

('4586', 'Pension fund — vested component (deduction)',
  'Deduction', true,
  'From 2017.',
  517),

('4587', 'Provident fund — vested component (deduction)',
  'Deduction', true,
  'From 2021.',
  518),

('4588', 'Two-pot — savings component contributions',
  'Deduction', true,
  'Applicable from 2026 year of assessment.',
  519),

('4589', 'Two-pot — retirement component contributions',
  'Deduction', true,
  'Applicable from 2026 year of assessment.',
  520),

-- ============================================================
-- EMPLOYEES TAX CODES
-- ============================================================

('4101', 'Employees tax (PAYE) deducted',
  'Employees Tax', true,
  'Total PAYE deducted from employee during the year.',
  600),

('4102', 'PAYE — pay as you earn',
  'Employees Tax', true,
  'Standard PAYE deduction.',
  601),

('4115', 'PAYE on retirement/withdrawal lump sums',
  'Employees Tax', true,
  'PAYE deducted on retirement or withdrawal lump sums.',
  602),

('4116', 'PAYE — foreign employment income',
  'Employees Tax', true,
  'From 2013.',
  603),

('4141', 'ETI — Employment Tax Incentive',
  'Employees Tax', false,
  'Employment Tax Incentive claimed by employer.',
  604),

('4142', 'ETI — monthly ETI amount',
  'Employees Tax', false,
  'Monthly ETI amount.',
  605),

-- ============================================================
-- OTHER INCOME (non-IRP5 — used in ITR12 personal returns)
-- These appear in your tax calc sheets, not on IRP5 certificates
-- ============================================================

('4201', 'Local interest income',
  'Other Income', true,
  'Interest from SA sources. R23,800 exemption (under 65) or R34,500 (65+). Report gross, show exemption separately.',
  700),

('4210', 'Rental income — immovable property',
  'Other Income', true,
  'Net rental income after deducting allowable expenses (rates, levies, insurance, interest, maintenance).',
  701),

('4216', 'Foreign interest and dividends',
  'Other Income', true,
  'Foreign interest and foreign dividends. R235 exemption on foreign dividends.',
  702),

('4250', 'Capital gain',
  'Other Income', true,
  'Capital gain on disposal of assets. Annual exclusion R40,000. Only 40% of net gain included.',
  703),

('2316', 'Business income — sole proprietor / trade',
  'Other Income', true,
  'Net profit from sole proprietor business or trade after all business expenses.',
  704),

('2530', 'Partnership income',
  'Other Income', true,
  'Share of partnership profit/loss allocated to partner.',
  705),

('2532', 'Rental income — sole prop / business property',
  'Other Income', true,
  'Rental income through a business/sole prop (Gantouw Eiendomme type). Net after expenses.',
  706),

('2930', 'Professional practice income',
  'Other Income', true,
  'Income from professional practice (doctors, lawyers, accountants etc.). Net after practice expenses.',
  707),

('3110', 'Trading income — other',
  'Other Income', true,
  'Other trading or business income not classified elsewhere.',
  708),

('3198', 'Business/trading income — other entity',
  'Other Income', true,
  'Income from other business activities (e.g. entertainment, events, other ventures).',
  709),

('4029', 'Retirement fund contributions — deduction (ITR12)',
  'Deduction', true,
  'RA/pension/provident contributions claimed as deduction on personal return. Max 27.5% of higher of taxable income or remuneration, capped at R350,000.',
  800);


-- ============================================================
-- INDEX for fast lookup in dropdown
-- ============================================================
create index on sars_codes(category);
create index on sars_codes(sort_order);

-- ============================================================
-- VERIFY
-- ============================================================
select category, count(*) as code_count
from sars_codes
group by category
order by category;