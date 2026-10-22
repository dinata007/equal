// Data sesi untuk aplikasi (SPA): pengguna yang login & status database.
export const load = ({ locals }) => ({ user: locals.user, dbReady: locals.dbReady, dbError: locals.dbError });
