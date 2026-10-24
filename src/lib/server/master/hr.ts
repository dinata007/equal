/**
 * Master HR dari tabel lama (PowerBuilder W_MS_08, W_100_06, W_100_07, w_ms_*): pegawai, UMR, tunjangan
 * pegawai & atributnya. Riwayat kontrak pegawai: kontrak.ts.
 */
import * as M from '#lib/domain/defs/masters.ts';
import { AuthError } from '../auth/users.ts';
import { sql } from '../db.ts';
import { seq } from './codes.ts';
import type { Resource, Values } from './registry.ts';

const ATRIBUT = '/hr/master/atribut-pegawai';
const stamp = { user: 'user_entry', time: 'tgl_entry' };
/**
 * Awalan NIK = singkatan perusahaan (gs_sing PB: site 01/semua = SJ, 11 = GG, lainnya EQ).
 * Pengguna web tidak terikat site, dan semua NIK di database berawalan SJ.
 */
const NIK_PREFIX = 'SJ';

const dipakaiPegawai = (col: string): [string, string][] => [
	['Pegawai', `dbo.M_PEGAWAI WHERE ${col} = @${col}`],
	['Kontrak pegawai', `dbo.M_PEGAWAI_KONTRAK WHERE ${col} = @${col}`]
];

/** W_MS_08_ENTRY cb_save: NIK = SJ + yyMM tanggal masuk + 2 digit urut per bulan */
async function nextPegawai(req: () => sql.Request, v: Values) {
	const d = v.tgl_kontrak_awal as Date;
	const prefix = `${NIK_PREFIX}${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
	const r = await req().input('p', sql.VarChar(6), prefix).query(`
		SELECT MAX(TRY_CAST(RIGHT(RTRIM(nik), 2) AS int)) AS n FROM dbo.M_PEGAWAI WITH (UPDLOCK, HOLDLOCK) WHERE LEFT(nik, 6) = @p`);
	const n = (r.recordset[0]?.n ?? 0) + 1;
	if (n > 99) throw new AuthError(`Nomor urut NIK ${prefix} sudah habis`);
	v.nik = prefix + String(n).padStart(2, '0');
	v.pt_id = 1;
}

export const HR: Record<string, Resource> = {
	pegawai: {
		def: M.employee,
		menu: '/hr/master/pegawai',
		table: 'dbo.M_PEGAWAI',
		keys: ['peg_id'],
		identity: 'peg_id',
		order: 'nama, nik',
		stamp,
		next: nextPegawai,
		usedIn: [
			['Absensi', 'dbo.attend WHERE peg_id = @peg_id'],
			['Izin', 'dbo.T_PEGAWAI_IZIN WHERE peg_id = @peg_id'],
			['Cuti', 'dbo.T_PEG_CUTI WHERE peg_id = @peg_id'],
			['Tunjangan pegawai', 'dbo.M_PEGAWAI_TUNJANGAN WHERE peg_id = @peg_id'],
			['Customer (pegangan)', 'dbo.M_CUSTOMER c WHERE c.nik = (SELECT nik FROM dbo.M_PEGAWAI WHERE peg_id = @peg_id)']
		],
		// riwayat kontrak milik pegawai ini ikut terhapus
		cascade: ['dbo.M_PEGAWAI_KONTRAK WHERE peg_id = @peg_id']
	},
	umr: {
		def: M.umr,
		menu: '/hr/master/umr',
		table: 'dbo.M_GAJI_UMR',
		keys: ['umr_id'],
		identity: 'umr_id',
		order: 'periode DESC',
		stamp,
		check: async (_req, v) => (!(Number(v.umr) > 0) ? 'UMR harus diisi' : !(Number(v.hari) > 0) ? 'Total hari kerja harus diisi' : null)
	},
	tunjangan: {
		def: M.allowance,
		menu: '/hr/master/tunjangan',
		table: 'dbo.M_PEGAWAI_TUNJANGAN',
		keys: ['tunj_id'],
		identity: 'tunj_id',
		order: 'tgl DESC, tunj_id DESC',
		stamp,
		// NIK disalin dari data pegawai (tombol cari pegawai PB)
		check: async (req, v) => {
			const r = await req().input('p', sql.Numeric(18, 0), Number(v.peg_id)).query('SELECT nik FROM dbo.M_PEGAWAI WHERE peg_id = @p');
			if (!r.recordset[0]) return 'Pegawai tidak ditemukan';
			v.nik = String(r.recordset[0].nik ?? '').trim() || null;
			return null;
		}
	},
	jabatan: {
		def: M.employeePosition,
		menu: ATRIBUT,
		table: 'dbo.M_PEGAWAI_JABATAN',
		keys: ['jab_id'],
		identity: 'jab_id',
		order: 'jab_id',
		usedIn: dipakaiPegawai('jab_id')
	},
	divisi: {
		def: M.employeeDivision,
		menu: ATRIBUT,
		table: 'dbo.M_DIVISI',
		keys: ['divisi_id'],
		order: 'divisi_id',
		// w_ms_divisi: maks + 1, 2 digit
		next: async (req, v) => void (v.divisi_id = await seq(req(), 'dbo.M_DIVISI', 'divisi_id', '', 2)),
		usedIn: [...dipakaiPegawai('divisi_id'), ['Pengguna aplikasi lama', 'dbo.SYS_USER WHERE divisi_id = @divisi_id']]
	},
	'group-pegawai': {
		def: M.employeeGroup,
		menu: ATRIBUT,
		table: 'dbo.M_PEGAWAI_GROUP',
		keys: ['group_peg_id'],
		identity: 'group_peg_id',
		order: 'group_peg_id',
		usedIn: dipakaiPegawai('group_peg_id')
	},
	shift: {
		def: M.employeeShift,
		menu: ATRIBUT,
		table: 'dbo.M_PEGAWAI_SHIFT',
		keys: ['shift_id'],
		identity: 'shift_id',
		order: 'shift_id',
		usedIn: [
			['Pegawai', 'dbo.M_PEGAWAI WHERE shift_id = @shift_id'],
			['Absensi', 'dbo.attend WHERE shift_id = @shift_id']
		]
	},
	lembur: {
		def: M.employeeOvertime,
		menu: ATRIBUT,
		table: 'dbo.M_PEGAWAI_LEMBUR',
		keys: ['lembur_id'],
		identity: 'lembur_id',
		order: 'jam1',
		check: async (_req, v) => (v.jam1 && v.jam2 && v.jam1 >= v.jam2 ? 'Jam akhir harus setelah jam awal' : null)
	}
};
