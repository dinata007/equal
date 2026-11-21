import type { SessionUser } from '#lib/domain/types.ts';
import { AuthError } from './auth/users.ts';
import { request } from './db.ts';
import { brandScope, brandWhere } from './master/service.ts';

export interface CustomerDebt {
	id: string;
	name: string;
	lastPurchaseDate: string | null;
	lastPaymentDate: string | null;
	purchases: number;
	payments: number;
	balance: number;
}

export interface CustomerDebtSummary {
	at: string;
	count: number;
	totals: { purchases: number; payments: number; balance: number };
	customers: CustomerDebt[];
}

export async function rekapHutangCustomer(user: SessionUser, detail: boolean): Promise<CustomerDebtSummary> {
	if (!user.admin && !user.menus.some((menu) => menu.startsWith('/akunting/ar/'))) {
		throw new AuthError('Anda tidak punya akses ke data piutang customer', 403);
	}

	const req = await request();
	const brand = brandWhere(req, 'a.brand_id', false, brandScope(user));
	const activityBrand = brand.replace(/\ba\.brand_id\b/g, 'activity_sale.brand_id');
	const limit = detail ? '' : 'TOP (10)';
	const result = await req.query(`
		WITH customer_source AS (
			SELECT '12' AS site_id, RTRIM(toko_id) AS cust_id, RTRIM(nama) AS name
			FROM dbo.M_TOKO
			WHERE brand_id = 'B'
			UNION ALL
			SELECT RTRIM(site_id), RTRIM(cust_id), RTRIM(nama)
			FROM dbo.M_CUSTOMER
		),
		customers AS (
			SELECT site_id, cust_id, MAX(name) AS name
			FROM customer_source
			GROUP BY site_id, cust_id
		),
		customer_activity AS (
			SELECT activity_sale.site_id, activity_sale.cust_id,
				CONVERT(char(10), MAX(activity_sale.tgl), 23) AS last_invoice_date,
				CONVERT(char(10), MAX(payment.tgl), 23) AS last_payment_date
			FROM dbo.T_TOKO1 activity_sale
			JOIN customers c ON c.site_id = activity_sale.site_id AND c.cust_id = activity_sale.cust_id
			LEFT JOIN dbo.T_PAYMENT payment
				ON payment.site_id = activity_sale.site_id AND payment.bukti_ref = activity_sale.bukti
			WHERE activity_sale.tipe_trans = 'JUAL'
				AND NULLIF(LTRIM(RTRIM(activity_sale.tipe_bayar)), '') IS NOT NULL
				AND activity_sale.tipe_bayar NOT IN ('BOOKING', 'BATAL')
				AND ${activityBrand}
			GROUP BY activity_sale.site_id, activity_sale.cust_id
		),
		debts AS (
			SELECT a.site_id, a.cust_id, c.name,
				MAX(activity.last_invoice_date) AS last_invoice_date,
				MAX(activity.last_payment_date) AS last_payment_date,
				SUM(ISNULL(a.total, 0)) AS purchases,
				SUM(ISNULL(a.payment, 0)) AS payments,
				SUM(ISNULL(a.total, 0) - ISNULL(a.payment, 0)) AS balance
			FROM dbo.T_TOKO1 a
			JOIN customers c ON c.site_id = a.site_id AND c.cust_id = a.cust_id
			LEFT JOIN customer_activity activity ON activity.site_id = a.site_id AND activity.cust_id = a.cust_id
			WHERE a.tipe_trans = 'JUAL'
				AND a.tipe_bayar NOT IN ('BOOKING', 'BATAL')
				AND ${brand}
			GROUP BY a.site_id, a.cust_id, c.name
			HAVING SUM(ISNULL(a.total, 0) - ISNULL(a.payment, 0)) > 0
		)
		SELECT ${limit}
			CONCAT(RTRIM(site_id), ':', RTRIM(cust_id)) AS id,
			name, last_invoice_date, last_payment_date, purchases, payments, balance,
			COUNT(*) OVER() AS customer_count,
			SUM(purchases) OVER() AS total_purchases,
			SUM(payments) OVER() AS total_payments,
			SUM(balance) OVER() AS total_balance
		FROM debts
		ORDER BY balance DESC, name ASC, site_id ASC, cust_id ASC;`);

	const rows = result.recordset as Record<string, unknown>[];
	const first = rows[0];
	const amount = (value: unknown) => Math.round(Number(value) || 0);
	const dateValue = (value: unknown) => (value == null ? null : value instanceof Date ? value.toISOString() : String(value));
	return {
		at: new Date().toISOString(),
		count: Number(first?.customer_count) || 0,
		totals: {
			purchases: amount(first?.total_purchases),
			payments: amount(first?.total_payments),
			balance: amount(first?.total_balance)
		},
		customers: rows.map((row) => ({
			id: String(row.id),
			name: String(row.name ?? '').trim(),
			lastPurchaseDate: dateValue(row.last_invoice_date),
			lastPaymentDate: dateValue(row.last_payment_date),
			purchases: amount(row.purchases),
			payments: amount(row.payments),
			balance: amount(row.balance)
		}))
	};
}
