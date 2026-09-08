/**
 * Spreadsheet import.
 *
 * The promise on the marketing page is "export your listings and import the
 * file in one step", and the help guide adds the part that matters: rows with
 * no price come in as drafts rather than being rejected. An importer that
 * refuses a file because forty rows out of two hundred are imperfect is an
 * importer nobody uses twice.
 *
 * So this parses whatever it is given, guesses the mapping, and reports what it
 * could not read per row — without discarding the row.
 */

export type Field =
  | 'reference' | 'titleEn' | 'titleAr' | 'zone' | 'compound' | 'type'
  | 'purpose' | 'areaSqm' | 'bedrooms' | 'price' | 'downPct' | 'years'
  | 'delivery' | 'finishing' | 'agent';

export const FIELDS: { id: Field; label: string; required: boolean }[] = [
  { id: 'reference', label: 'Reference', required: false },
  { id: 'titleEn', label: 'Title (English)', required: true },
  { id: 'titleAr', label: 'Title (Arabic)', required: false },
  { id: 'zone', label: 'Zone', required: true },
  { id: 'compound', label: 'Compound', required: false },
  { id: 'type', label: 'Unit type', required: false },
  { id: 'purpose', label: 'Purpose', required: false },
  { id: 'areaSqm', label: 'Area (m²)', required: true },
  { id: 'bedrooms', label: 'Bedrooms', required: false },
  { id: 'price', label: 'Price', required: false },
  { id: 'downPct', label: 'Down payment %', required: false },
  { id: 'years', label: 'Instalment years', required: false },
  { id: 'delivery', label: 'Delivery', required: false },
  { id: 'finishing', label: 'Finishing', required: false },
  { id: 'agent', label: 'Agent', required: false },
];

/** Header names we have actually seen, in both languages and in the shapes
 *  Property Finder and OLX exports use. */
const ALIASES: Record<Field, string[]> = {
  reference: ['reference', 'ref', 'code', 'unit code', 'id', 'كود', 'الكود', 'المرجع'],
  titleEn: ['title', 'name', 'unit', 'unit name', 'title en', 'english title', 'description'],
  titleAr: ['title ar', 'arabic title', 'العنوان', 'الاسم', 'اسم الوحدة'],
  zone: ['zone', 'area name', 'district', 'location', 'city', 'منطقة', 'المنطقة'],
  compound: ['compound', 'project', 'development', 'كمبوند', 'المشروع'],
  type: ['type', 'unit type', 'property type', 'نوع', 'النوع'],
  purpose: ['purpose', 'offering', 'sale or rent', 'listing type'],
  areaSqm: ['area', 'size', 'sqm', 'm2', 'built up area', 'المساحة', 'مساحة'],
  bedrooms: ['bedrooms', 'beds', 'bed', 'rooms', 'غرف', 'عدد الغرف'],
  price: ['price', 'total price', 'asking price', 'amount', 'السعر', 'سعر'],
  downPct: ['down payment', 'down', 'downpayment %', 'dp', 'المقدم'],
  years: ['years', 'installment years', 'plan years', 'سنوات'],
  delivery: ['delivery', 'handover', 'ready', 'استلام', 'التسليم'],
  finishing: ['finishing', 'finish', 'condition', 'التشطيب'],
  agent: ['agent', 'owner', 'sales agent', 'assigned to'],
};

export type Sheet = { headers: string[]; rows: string[][] };

/**
 * A CSV/TSV parser that handles quoted cells.
 *
 * Written rather than pulled in: an agency's export has commas inside
 * descriptions and quotes inside Arabic titles, and a naive split on "," turns
 * one unit into three. Tabs are detected because a paste out of Excel is
 * tab-separated, which is the most common way this data will arrive.
 */
export function parseSheet(text: string): Sheet {
  const clean = text.replace(/\r\n?/g, '\n').trim();
  if (!clean) return { headers: [], rows: [] };

  const firstLine = clean.split('\n')[0];
  const delim = firstLine.includes('\t') ? '\t' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quoted) {
      if (c === '"') {
        if (clean[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === delim) { row.push(cell.trim()); cell = ''; continue; }
    if (c === '\n') { row.push(cell.trim()); rows.push(row); row = []; cell = ''; continue; }
    cell += c;
  }
  row.push(cell.trim());
  rows.push(row);

  const [headers = [], ...body] = rows;
  // A trailing blank line is normal in an export and is not a unit.
  return { headers, rows: body.filter((r) => r.some((v) => v !== '')) };
}

/** Guess which column is which, by header name. */
export function guessMapping(headers: string[]): Record<Field, number | null> {
  const norm = (s: string) => s.toLowerCase().replace(/[_\-.]/g, ' ').replace(/\s+/g, ' ').trim();
  const cols = headers.map(norm);
  const used = new Set<number>();
  const out = {} as Record<Field, number | null>;

  for (const { id } of FIELDS) {
    const names = ALIASES[id];
    // Exact header match first, then a contained one — "unit type" should win
    // "type" over a column merely containing the word.
    let found = cols.findIndex((c, i) => !used.has(i) && names.includes(c));
    if (found < 0) found = cols.findIndex((c, i) => !used.has(i) && names.some((n) => c.includes(n)));
    out[id] = found >= 0 ? found : null;
    if (found >= 0) used.add(found);
  }
  return out;
}

const TYPES = ['APARTMENT', 'DUPLEX', 'PENTHOUSE', 'VILLA', 'TWIN_HOUSE', 'TOWNHOUSE', 'CHALET', 'STUDIO', 'OFFICE'];

function toType(v: string): string {
  const s = v.toLowerCase();
  if (s.includes('twin')) return 'TWIN_HOUSE';
  if (s.includes('town')) return 'TOWNHOUSE';
  if (s.includes('pent')) return 'PENTHOUSE';
  if (s.includes('duplex')) return 'DUPLEX';
  if (s.includes('villa') || s.includes('فيلا')) return 'VILLA';
  if (s.includes('chalet') || s.includes('شاليه')) return 'CHALET';
  if (s.includes('studio') || s.includes('استوديو')) return 'STUDIO';
  if (s.includes('office') || s.includes('مكتب')) return 'OFFICE';
  const up = v.toUpperCase().replace(/\s+/g, '_');
  return TYPES.includes(up) ? up : 'APARTMENT';
}

/** Numbers arrive as "8,450,000", "8.45M", "EGP 8450000" or "١٢٣". */
function toNumber(v: string): number | null {
  if (!v) return null;
  // Eastern Arabic numerals appear in sheets typed on an Arabic keyboard.
  const western = v.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  const m = western.toLowerCase().replace(/[^\d.,km]/g, '');
  if (!m) return null;
  const mult = m.endsWith('m') ? 1_000_000 : m.endsWith('k') ? 1_000 : 1;
  const n = Number(m.replace(/[km]/g, '').replace(/,/g, ''));
  return Number.isFinite(n) ? n * mult : null;
}

export type ImportRow = {
  index: number;
  values: Partial<Record<Field, string | number | null>>;
  issues: string[];
  /** Rows with no price still come in — as drafts. */
  status: 'LIVE' | 'DRAFT';
};

export function mapRows(sheet: Sheet, mapping: Record<Field, number | null>): ImportRow[] {
  return sheet.rows.map((cells, index) => {
    const raw = (f: Field) => {
      const i = mapping[f];
      return i === null || i === undefined ? '' : (cells[i] ?? '').trim();
    };

    const issues: string[] = [];
    const price = toNumber(raw('price'));
    const area = toNumber(raw('areaSqm'));
    const titleEn = raw('titleEn');
    const zone = raw('zone');

    if (!titleEn) issues.push('no title');
    if (!zone) issues.push('no zone');
    if (area === null) issues.push('no area');
    if (price === null) issues.push('no price — will import as a draft');
    if (!raw('titleAr')) issues.push('no Arabic title');

    return {
      index,
      values: {
        reference: raw('reference') || null,
        titleEn,
        titleAr: raw('titleAr'),
        zone,
        compound: raw('compound') || null,
        type: raw('type') ? toType(raw('type')) : 'APARTMENT',
        purpose: raw('purpose').toLowerCase().includes('rent') ? 'RENT' : 'PRIMARY',
        areaSqm: area,
        bedrooms: toNumber(raw('bedrooms')),
        price,
        downPct: toNumber(raw('downPct')),
        years: toNumber(raw('years')),
        delivery: raw('delivery'),
        finishing: raw('finishing'),
        agent: raw('agent'),
      },
      issues,
      status: price === null ? 'DRAFT' : 'LIVE',
    };
  });
}

export type ImportSummary = {
  total: number;
  ready: number;
  drafts: number;
  blocked: number;
  missingArabic: number;
};

/** A row is only blocked if it cannot become a unit at all. Everything else is
 *  a note, because a draft an agent can fix beats a row that was thrown away. */
export function summarise(rows: ImportRow[]): ImportSummary {
  const blocked = rows.filter((r) => r.issues.some((i) => i === 'no title' || i === 'no zone' || i === 'no area'));
  return {
    total: rows.length,
    ready: rows.filter((r) => r.status === 'LIVE' && !blocked.includes(r)).length,
    drafts: rows.filter((r) => r.status === 'DRAFT' && !blocked.includes(r)).length,
    blocked: blocked.length,
    missingArabic: rows.filter((r) => r.issues.includes('no Arabic title')).length,
  };
}

/** A file an agency can open, fill in and send back. Beats a blank page. */
export const SAMPLE_CSV = [
  'Reference,Title,Arabic title,Zone,Compound,Type,Area,Bedrooms,Price,Down payment,Years,Delivery,Finishing',
  'AM-2001,Garden apartment with private entrance,شقة بجاردن بمدخل خاص,New Cairo,Mivida,Apartment,165,3,"7,300,000",10,8,Q4 2027,Fully finished',
  'AM-2002,Sea-view chalet second row,شاليه بفيو بحري الصف الثاني,North Coast,Marassi,Chalet,110,2,"8,900,000",15,6,2028,Semi-finished',
  'AM-2003,Standalone villa on the golf,فيلا مستقلة على الجولف,Sheikh Zayed,Allegria,Villa,410,5,"29,500,000",20,5,Ready,Core & shell',
  'AM-2004,Studio near the clubhouse,استوديو بجوار الكلوب هاوس,6th of October,Badya,Studio,58,0,,,,Q1 2028,Fully finished',
].join('\n');
