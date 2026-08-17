// TODO: derive from the authenticated user's org membership once
// multi-organization support lands, instead of a fixed slug.
export const ORG_SLUG = 'ledgerway';

/** The app's mount path, with any trailing slash stripped (e.g. '' or '/app'). */
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');
