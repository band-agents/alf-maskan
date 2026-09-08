/**
 * The seed.
 *
 * Everything the mock layer serves, written to a real database — two agencies,
 * their people, their units with media, and their collections. Running it turns
 * the demo into data you can edit, and the screens should not change by a pixel
 * when you do. That is the test: if a page looks different after seeding, the
 * mock and the schema disagreed about something and this is where it shows.
 *
 *   npm run db:push     once, to create the tables
 *   npm run db:seed     as often as you like — it is idempotent
 *
 * Idempotent by upsert on the natural keys (store slug, store+reference,
 * store+collection slug), so re-running corrects drift rather than duplicating
 * an inventory. Nothing here deletes, so a unit you added by hand survives.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import { mockStores } from '../lib/mock';
import { unitsForStore } from '../lib/queries/units';
import { collectionsFor } from '../lib/queries/collections';
import { membersFor, type RoleId } from '../lib/queries/team';
import { unitDetail } from '../lib/queries/unit-detail';
import { toDbFields } from '../lib/queries/unit-map';

const db = new PrismaClient();

/** The team screen's roles are the schema's, in lower case. */
const ROLE: Record<RoleId, Prisma.MembershipCreateInput['role']> = {
  owner: 'OWNER',
  admin: 'ADMIN',
  manager: 'SALES_MANAGER',
  agent: 'AGENT',
  editor: 'CONTENT_EDITOR',
  accountant: 'ACCOUNTANT',
  viewer: 'VIEWER',
};

async function main() {
  console.log('Seeding Alf Maskan…\n');

  for (const store of mockStores) {
    // ─────────────────────────────────────────────────────────── the store
    const row = await db.store.upsert({
      where: { slug: store.slug },
      update: {
        nameEn: store.nameEn, nameAr: store.nameAr, brandHex: store.brandHex,
        template: store.template, storeLangs: store.storeLangs,
        whatsapp: store.whatsapp, phone: store.phone, email: store.email, address: store.address,
      },
      create: {
        slug: store.slug,
        nameEn: store.nameEn, nameAr: store.nameAr, brandHex: store.brandHex,
        template: store.template, storeLangs: store.storeLangs,
        whatsapp: store.whatsapp, phone: store.phone, email: store.email, address: store.address,
      },
    });
    console.log(`  ${row.nameEn}  (${row.slug})`);

    // ─────────────────────────────────────────────────────────── the people
    // Pending invites are not users yet — they have never signed in, and a User
    // row for someone who has not accepted is a login waiting to be wrong.
    const people = membersFor(store.id).filter((m) => !m.pending);
    for (const m of people) {
      const user = await db.user.upsert({
        where: { email: m.email },
        update: { name: m.name },
        create: { email: m.email, name: m.name },
      });
      await db.membership.upsert({
        where: { storeId_userId: { storeId: row.id, userId: user.id } },
        update: { role: ROLE[m.role], scopeZones: m.scope },
        create: { storeId: row.id, userId: user.id, role: ROLE[m.role], scopeZones: m.scope, acceptedAt: new Date() },
      });
    }
    console.log(`    ${people.length} people`);

    // ──────────────────────────────────────────────────────────── the units
    const units = unitsForStore(store.id);
    for (const u of units) {
      const d = unitDetail(u);
      const owner = await db.user.findFirst({ where: { name: u.agent } });

      // Shared with the save actions, so a field cannot be seeded and then
      // silently not saved when an agent edits it.
      const fields = { ...toDbFields(u, d), viewCount: u.views, ownerId: owner?.id ?? null };

      const unit = await db.unit.upsert({
        where: { storeId_reference: { storeId: row.id, reference: u.reference } },
        update: fields,
        create: { storeId: row.id, reference: u.reference, ...fields },
      });

      // Media is replaced rather than merged: position is the whole meaning
      // here (0 is the cover), and merging two orderings produces neither.
      await db.media.deleteMany({ where: { unitId: unit.id } });
      if (d.media.length) {
        await db.media.createMany({
          data: d.media.map((m, i) => ({
            unitId: unit.id,
            kind: m.kind === 'plan' ? ('FLOOR_PLAN' as const) : ('PHOTO' as const),
            // No object storage yet, so the placeholder label is the record of
            // what the photo is meant to be. A fake CDN URL would be worse.
            url: `placeholder:${m.label}`,
            altEn: m.label,
            position: i,
          })),
        });
      }
    }
    console.log(`    ${units.length} units`);

    // ────────────────────────────────────────────────────── the collections
    const collections = collectionsFor(store.id);
    for (const c of collections) {
      const coll = await db.collection.upsert({
        where: { storeId_slug: { storeId: row.id, slug: c.slug } },
        update: {
          nameEn: c.nameEn, nameAr: c.nameAr, descEn: c.description,
          mode: c.auto ? 'AUTOMATIC' : 'MANUAL',
          matchAll: c.match === 'all',
          conditions: c.rules as unknown as Prisma.InputJsonValue,
        },
        create: {
          storeId: row.id, slug: c.slug,
          nameEn: c.nameEn, nameAr: c.nameAr, descEn: c.description,
          mode: c.auto ? 'AUTOMATIC' : 'MANUAL',
          matchAll: c.match === 'all',
          conditions: c.rules as unknown as Prisma.InputJsonValue,
        },
      });

      // Only a manual collection stores its members. An automatic one is a
      // query, and materialising it here would be a second answer that goes
      // stale the moment a unit changes.
      if (!c.auto) {
        await db.collectionUnit.deleteMany({ where: { collectionId: coll.id } });
        const members = await db.unit.findMany({
          where: { storeId: row.id, reference: { in: c.refs } },
          select: { id: true },
        });
        await db.collectionUnit.createMany({
          data: members.map((m, i) => ({ collectionId: coll.id, unitId: m.id, position: i })),
        });
      }
    }
    console.log(`    ${collections.length} collections\n`);
  }

  const [stores, units, users] = await Promise.all([
    db.store.count(), db.unit.count(), db.user.count(),
  ]);
  console.log(`Done — ${stores} stores, ${units} units, ${users} people.`);
  console.log('The screens should look identical. If one changed, the mock and the schema disagreed.');
}

main()
  .catch((e) => {
    console.error('\nSeed failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
