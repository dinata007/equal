/**
 * Riwayat kontrak pegawai (PowerBuilder W_MS_08_ENTRY2): JOIN, PERPANJANG, ROLLING, RESIGN.
 * Kontrak baru menonaktifkan kontrak sebelumnya; RESIGN menonaktifkan pegawai.
 */
import type { SessionUser } from '#lib/erp/types.ts';
import { audit } from '../auth/audit.ts';
import { AuthError } from '../auth/users.ts';
import { getPool, request, sql } from '../db.ts';
import { get } from './service.ts';

export const TIPE_KONTRAK = ['JOIN', 'PERPANJANG', 'ROLLING', 'RESIGN'] as const;

const ymd = (d: Date | null) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null);
const trim = (v: unknown) => (v == null ? null : String(v).trim());

const pegawaiOf = async (user: SessionUser, id: string) => (await get('pegawai', user, id)) as Record<string, any>;

async function rows(pegId: number) {
	const r = await (await request()).input('p', sql.Numeric(18, 0), pegId).query(`
		SELECT kontrak_id, tipe, tgl, tgl_awal, tgl_akhir, remark, jab_id, divisi_id, group_peg_id, sts_peg, cust_id, tipe_id,
			CAST(ISNULL(status_aktif, 0) AS bit) AS status_aktif, CAST(ISNULL(status_pegangan, 0) AS bit) AS status_pegangan, user_entry, tgl_entry
		FROM dbo.M_PEGAWAI_KONTRAK WHERE peg_id = @p ORDER BY kontrak_id DESC`);
	return r.recordset.map((x) => ({
		id: String(x.kontrak_id),
		tipe: trim(x.tipe),
		tgl: ymd(x.tgl),
		tgl_awal: ymd(x.tgl_awal),
		tgl_akhir: ymd(x.tgl_akhir),
		remark: trim(x.remark),
		jab_id: trim(x.jab_id),
		divisi_id: trim(x.divisi_id),
		group_peg_id: trim(x.group_peg_id),
		sts_peg: trim(x.sts_peg),
		cust_id: trim(x.cust_id),
		tipe_id: x.tipe_id,
		aktif: !!x.status_aktif,
		pegangan: !!x.status_pegangan,
		user: trim(x.user_entry),
		at: x.tgl_entry
	}));
}

export async function list(user: SessionUser, pegId: string) {
	const p = await pegawaiOf(user, pegId);
	return { rows: await rows(Number(p.peg_id)), pegawai: { jab_id: p.jab_id, divisi_id: p.divisi_id, group_peg_id: p.group_peg_id, sts_peg: p.sts_peg } };
}

const date = (v: unknown, label: string, required = false) => {
	if (v == null || v === '') {
		if (required) throw new AuthError(`${label} wajib diisi`);
		return null;
	}
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v));
	const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
	if (!d || Number.isNaN(d.getTime())) throw new AuthError(`${label} bukan tanggal yang valid`);
	return d;
};

export async function add(user: SessionUser, pegId: string, input: Record<string, unknown>, ip: string) {
	const p = await pegawaiOf(user, pegId);
	const peg = Number(p.peg_id);
	const tipe = String(input.tipe ?? '');
	if (!(TIPE_KONTRAK as readonly string[]).includes(tipe)) throw new AuthError('Tipe kontrak tidak valid');
	const sts = String(input.sts_peg ?? 'PKWT');
	if (!['PKWT', 'Tetap'].includes(sts)) throw new AuthError('Status pegawai tidak valid');
	const tgl = date(input.tgl, 'Tanggal', true)!;
	const awal = date(input.tgl_awal, 'Tanggal awal kontrak', true)!;
	// pegawai tetap boleh tanpa tanggal akhir
	const akhir = date(input.tgl_akhir, 'Tanggal akhir kontrak', sts === 'PKWT');
	if (akhir && awal >= akhir) throw new AuthError('Tanggal akhir kontrak harus setelah tanggal awal');
	const text = (k: string, max: number) => {
		const v = input[k] == null ? '' : String(input[k]).trim();
		if (v.length > max) throw new AuthError(`${k} maksimal ${max} karakter`);
		return v || null;
	};
	const jab = text('jab_id', 18);
	const divisi = text('divisi_id', 5);
	const group = text('group_peg_id', 18);
	const remark = text('remark', 100);
	if (!divisi) throw new AuthError('Divisi wajib diisi');
	if (!group) throw new AuthError('Group wajib diisi');

	const tx = new sql.Transaction(await getPool());
	await tx.begin();
	let id: string;
	try {
		const q = () => new sql.Request(tx).input('p', sql.Numeric(18, 0), peg);
		const ref = await q()
			.input('j', sql.VarChar(18), jab ?? '')
			.input('d', sql.VarChar(5), divisi)
			.input('g', sql.VarChar(18), group).query(`
				SELECT (SELECT COUNT(*) FROM dbo.M_PEGAWAI_JABATAN WHERE CAST(jab_id AS varchar(18)) = @j) AS j,
					(SELECT COUNT(*) FROM dbo.M_DIVISI WHERE divisi_id = @d) AS d,
					(SELECT COUNT(*) FROM dbo.M_PEGAWAI_GROUP WHERE CAST(group_peg_id AS varchar(18)) = @g) AS g,
					(SELECT COUNT(*) FROM dbo.M_PEGAWAI_KONTRAK WITH (UPDLOCK, HOLDLOCK) WHERE peg_id = @p AND tipe = 'JOIN' AND status_aktif = 1) AS joined`);
		const c = ref.recordset[0];
		if (jab && !c.j) throw new AuthError(`Jabatan ${jab} tidak ditemukan`);
		if (!c.d) throw new AuthError(`Divisi ${divisi} tidak ditemukan`);
		if (!c.g) throw new AuthError(`Group ${group} tidak ditemukan`);
		if (tipe === 'JOIN' && c.joined) throw new AuthError('Pegawai sudah JOIN');
		const last = (await q().query('SELECT TOP 1 kontrak_id, tgl_akhir, cust_id, tipe_id FROM dbo.M_PEGAWAI_KONTRAK WITH (UPDLOCK) WHERE peg_id = @p ORDER BY kontrak_id DESC')).recordset[0];
		if (!last && tipe !== 'JOIN') throw new AuthError('Pegawai belum pernah JOIN');
		if (tipe === 'PERPANJANG' && (!akhir || (last?.tgl_akhir && akhir <= last.tgl_akhir))) throw new AuthError('Tanggal akhir perpanjangan harus setelah akhir kontrak sebelumnya');

		// kontrak sebelumnya ditutup; status aktif pegawai mengikuti tipe kontrak
		if (last && tipe !== 'JOIN') {
			const pegangan = tipe === 'RESIGN' ? '' : ', status_pegangan = 1';
			await q().input('k', sql.Numeric(18, 0), last.kontrak_id).query(`UPDATE dbo.M_PEGAWAI_KONTRAK SET status_aktif = 0${pegangan} WHERE kontrak_id = @k`);
		}
		await q().input('a', sql.Char(1), tipe === 'RESIGN' ? 'N' : 'Y').query('UPDATE dbo.M_PEGAWAI SET flag_active = @a WHERE peg_id = @p');

		const resign = tipe === 'RESIGN';
		const r = await q()
			.input('nik', sql.VarChar(20), String(p.nik ?? '').trim() || null)
			.input('cust', sql.VarChar(15), trim(last?.cust_id) ?? '')
			.input('tipe', sql.VarChar(50), tipe)
			.input('tgl', sql.DateTime, tgl)
			.input('awal', sql.DateTime, awal)
			.input('akhir', sql.DateTime, akhir)
			.input('remark', sql.VarChar(100), remark)
			.input('jab', sql.Numeric(18, 0), jab ? Number(jab) : null)
			.input('divisi', sql.VarChar(5), divisi)
			.input('group', sql.Numeric(18, 0), Number(group))
			.input('sts', sql.VarChar(10), sts)
			.input('tipe_id', sql.BigInt, last?.tipe_id ?? p.tipe_id ?? null)
			.input('aktif', sql.Bit, !resign)
			.input('pegangan', sql.Bit, resign)
			.input('usr', sql.VarChar(30), user.name.slice(0, 30)).query(`
				INSERT INTO dbo.M_PEGAWAI_KONTRAK (peg_id, pt_id, cust_id, tipe, tgl, tgl_awal, tgl_akhir, remark, user_entry, tgl_entry, nik, tipe_id,
					jab_id, divisi_id, group_peg_id, status_pegangan, status_aktif, sts_peg)
				OUTPUT INSERTED.kontrak_id AS id
				VALUES (@p, 1, @cust, @tipe, @tgl, @awal, @akhir, @remark, @usr, GETDATE(), @nik, @tipe_id, @jab, @divisi, @group, @pegangan, @aktif, @sts)`);
		id = String(r.recordset[0].id);
		await tx.commit();
	} catch (e) {
		await tx.rollback().catch(() => {});
		throw e;
	}
	await audit('master.create', { userId: user.id, username: user.username, ip, detail: `kontrak ${p.nik}: ${tipe} #${id}` });
	return list(user, pegId);
}

export async function remove(user: SessionUser, pegId: string, kontrakId: string, ip: string) {
	const p = await pegawaiOf(user, pegId);
	if (!/^\d{1,18}$/.test(kontrakId)) throw new AuthError('Kontrak tidak ditemukan', 404);
	const r = await (await request())
		.input('p', sql.Numeric(18, 0), Number(p.peg_id))
		.input('k', sql.Numeric(18, 0), Number(kontrakId))
		.query('DELETE FROM dbo.M_PEGAWAI_KONTRAK WHERE peg_id = @p AND kontrak_id = @k');
	if (!r.rowsAffected[0]) throw new AuthError('Kontrak tidak ditemukan', 404);
	await audit('master.delete', { userId: user.id, username: user.username, ip, detail: `kontrak ${p.nik}: #${kontrakId}` });
	return list(user, pegId);
}
