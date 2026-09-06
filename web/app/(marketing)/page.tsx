import Link from 'next/link';
import { storefrontUrl } from '@/lib/tenant';
import { Faq } from '@/components/site/Faq';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteNav } from '@/components/site/SiteNav';

/**
 * The marketing home page.
 *
 * A port of src/pages/index.html, which is the spec. What stood here before was
 * a placeholder — a hero and two buttons — and it read as a broken deployment
 * rather than an unfinished one, because a marketing site with no sections is
 * not recognisably a marketing site.
 *
 * Every class comes from alf-maskan.css, which the layout already loads, so
 * this is a transcription rather than a redesign. Two things are deliberately
 * not transcribed. The calls to action point at what exists — the dashboard and
 * a real tenant storefront — rather than at a signup page that does not, and
 * the screenshots stay as labelled placeholders exactly as the static build
 * draws them, because inventing a photograph of a product is how a demo starts
 * lying about itself.
 */

export const metadata = {
  title: 'Alf Maskan — your own real-estate website, live in 10 minutes',
  description:
    'List your units, drag your storefront into shape, and send buyers a site that looks like it cost a fortune. EGP 990 a month, Arabic and English, no developer needed.',
};

const FAQ_ITEMS = [
  {
    q: 'Do I need a developer or a domain first?',
    a: 'No. You get a free address like kamal-estates.alfmaskan.com the moment you sign up. If you already own a domain, connect it in settings — we handle the certificate, and our team will do it for you for EGP 450 once.',
  },
  {
    q: 'Can I move my units from Property Finder or OLX?',
    a: 'Yes. Export your listings to a spreadsheet and import the file in one step — zone, price, area, finishing and payment plan map to Alf Maskan fields automatically. Anything we cannot match is listed for you to fix before it publishes.',
  },
  {
    q: 'Is the Arabic version a real RTL layout?',
    a: 'It is. The whole layout mirrors — navigation, cards, forms and icons all flip. Numbers, phone numbers and your logo stay the right way round, because those never mirror in Arabic.',
  },
  {
    q: 'How do I pay? Do you take Instapay or Vodafone Cash?',
    a: 'Card, Instapay and Vodafone Cash all work, billed in Egyptian pounds with VAT included. You get a tax invoice in the dashboard every month.',
  },
  {
    q: 'What happens to my site if I stop paying?',
    a: 'Your site shows a simple contact page instead of your listings, and every unit, photo and lead stays saved. Pay again and it is back exactly as you left it. You can also pause for up to two months a year.',
  },
];

const FEATURES = [
  {
    id: 'listings',
    flip: false,
    eyebrow: 'Listings',
    title: 'Every unit, described the way Egyptian buyers ask',
    body: 'Zone, compound, developer, unit type, finishing, delivery date and the full payment plan — down payment, years, monthly instalment. Fill it once and it renders correctly everywhere.',
    shot: 'listings table screenshot · 4:3',
    extra: (
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span className="chip">Bulk import from Excel</span>
        <span className="chip">Duplicate a unit</span>
        <span className="chip">Sold / reserved states</span>
      </div>
    ),
  },
  {
    id: 'builder',
    flip: true,
    eyebrow: 'Storefront builder',
    title: 'Drag sections. That is the whole skill.',
    body: 'Hero, featured units, zone map, payment plans, agent profiles, WhatsApp CTA. Drag them into the order you want, change the colours to yours, hit publish. Undo is always there.',
    shot: 'builder screenshot · 4:3',
    extra: (
      <p className="callout">
        <span className="callout__i" aria-hidden="true">i</span>
        <span>
          Changes go live only when you press Publish, so you can rebuild your site during
          working hours without anyone seeing it.
        </span>
      </p>
    ),
  },
  {
    id: 'team',
    flip: false,
    eyebrow: 'Team & roles',
    title: 'Your agents get their own page, not your password',
    body: 'Invite Nourhan, Karim and Omar. Each gets a profile on the site, their own leads, and permission to edit only their units. Owners keep billing and publishing.',
    shot: 'team & roles screenshot · 4:3',
    extra: (
      <div className="row row-gap-12">
        <span className="avatar-stack avatar-stack--md" aria-hidden="true">
          <span className="avatar avatar--md" />
          <span className="avatar avatar--md avatar--alt" />
          <span className="avatar avatar--md" />
        </span>
        <span className="meta">Unlimited agents on every plan.</span>
      </div>
    ),
  },
  {
    id: 'leads',
    flip: true,
    eyebrow: 'Leads & WhatsApp',
    title: 'The enquiry lands where you already work',
    body: 'Every unit has a WhatsApp button that opens a chat with the unit code already written. The lead is saved in Alf Maskan at the same time, so nothing is lost in a phone.',
    shot: 'leads inbox screenshot · 4:3',
    extra: (
      <p
        className="note"
        style={{
          height: 44,
          paddingInline: 18,
          borderRadius: 'var(--r-12)',
          fontSize: 'var(--t-meta)',
        }}
      >
        Average first reply: 4 minutes
      </p>
    ),
  },
  {
    id: 'branding',
    flip: false,
    eyebrow: 'Branding',
    title: 'It should look like your company, not like Alf Maskan',
    body: 'Upload your logo, choose your colours and fonts, connect your own domain. No Alf Maskan badge anywhere on your site.',
    shot: 'branding panel screenshot · 4:3',
    extra: (
      <div className="swatch-row">
        <span className="swatch" style={{ background: 'var(--palm-600)' }} />
        <span className="swatch" style={{ background: 'var(--sand-500)' }} />
        <span className="swatch" style={{ background: 'var(--ink-700)' }} />
        <span className="swatch" style={{ background: 'var(--info)' }} />
        <span className="swatch swatch--own">Your colour</span>
      </div>
    ),
  },
];

const QUOTES = [
  {
    quote:
      '“I used to send buyers a folder of photos on WhatsApp. Now I send one link and they see the payment plan themselves. Two deals closed in the first month.”',
    name: 'Youssef Kamal',
    where: 'Kamal Estates · New Cairo',
    alt: false,
  },
  {
    quote:
      '“The Arabic version is not a translation, it is properly built. My clients in Sheikh Zayed never switch to English.”',
    name: 'Nourhan Adel',
    where: 'Zayed Property Hub · Sheikh Zayed',
    alt: true,
  },
  {
    quote:
      '“A developer asked which agency built our website. It cost me EGP 990 and one evening.”',
    name: 'Karim ElSayed',
    where: 'Sokhna Coast Realty · Ain Sokhna',
    alt: false,
  },
];

const MINIS = [
  { title: 'Penthouse · Mivida', price: 'EGP 12,400,000', featured: false },
  { title: 'Chalet · Marassi', price: 'EGP 9,750,000', featured: true },
  { title: 'Villa · Hyde Park', price: 'EGP 18,900,000', featured: false },
];

const TEMPLATES = [
  { name: 'Marassi', blurb: 'Coastal · chalets and sea views', premium: false, more: false },
  { name: 'Zamalek', blurb: 'Luxury · one unit per page', premium: true, more: false },
  { name: 'Mostakbal', blurb: 'Portal · large inventories', premium: false, more: false },
  { name: 'Sokna', blurb: 'Single-project · one compound', premium: false, more: true },
];

export default function MarketingHome() {
  // The one tenant address that certainly resolves, wherever this is deployed.
  const demoStore = storefrontUrl('kamal-estates');

  return (
    <>
      <SiteNav />

      <main id="main">
        {/* ============================================ hero */}
        <section className="hero">
          <div className="wrap hero__grid">
            <div>
              <p className="eyebrow-pill">Now live in 11 governorates</p>
              <h1 className="hero-title hero__title">
                Your own real-estate website. Live in 10 minutes.
              </h1>
              <p className="lede hero__lede">
                List your units, drag your storefront into shape, and send buyers a site that
                looks like it cost a fortune. EGP 990 a month, Arabic and English, no developer
                needed.
              </p>

              <div className="hero__ctas">
                <Link className="btn btn--lg btn--primary" href="/dash">
                  Open the dashboard
                </Link>
                <a className="btn btn--lg btn--secondary" href={demoStore}>
                  <span className="play-dot">
                    <svg width="8" height="10" viewBox="0 0 8 10" aria-hidden="true">
                      <path d="M0 0l8 5-8 5z" fill="currentColor" />
                    </svg>
                  </span>
                  See a real storefront
                </a>
              </div>

              <div className="hero__proof">
                <div className="avatar-stack" aria-hidden="true">
                  <span className="avatar avatar--sm" />
                  <span className="avatar avatar--sm avatar--alt" />
                  <span className="avatar avatar--sm" />
                  <span className="avatar avatar--sm avatar-count">+180</span>
                </div>
                <p className="micro">
                  180 agencies already selling on Alf Maskan. No credit card to start.
                </p>
              </div>
            </div>

            {/* the product is the hero image: the storefront builder mid-drag */}
            <div className="builder">
              <div className="frame">
                <div className="frame__bar">
                  <span className="frame__dots" aria-hidden="true"><i /><i /><i /></span>
                  <span className="frame__url">editor.alfmaskan.com / kamal-estates</span>
                  <span className="note" style={{ height: 22, fontSize: 'var(--t-pico)' }}>
                    Saved · 2s ago
                  </span>
                </div>

                <div className="builder__body">
                  <div className="builder__rail">
                    <p className="kicker">Sections</p>
                    <div className="builder__item">Hero banner</div>
                    <div className="builder__item">Featured units</div>
                    <div className="builder__item builder__item--active">Map by zone</div>
                    <div className="builder__item">Payment plans</div>
                    <div className="builder__item">Agent profiles</div>
                    <div className="builder__item">WhatsApp CTA</div>
                    <div className="builder__publish">Publish</div>
                  </div>

                  <div className="builder__canvas">
                    <div
                      className="ph ph--label"
                      style={{ borderRadius: 'var(--r-12)', height: 170, position: 'relative' }}
                    >
                      <span>compound exterior · 16:9</span>
                      <div className="builder__overlay">
                        <span className="builder__overlay-title">Kamal Estates · New Cairo</span>
                        <span
                          className="badge"
                          style={{
                            background: 'var(--palm-600)',
                            color: '#fff',
                            height: 26,
                            paddingInline: 12,
                            flex: 'none',
                          }}
                        >
                          Browse units
                        </span>
                      </div>
                    </div>

                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
                        gap: 10,
                        marginTop: 12,
                      }}
                    >
                      {MINIS.map((m) => (
                        <div className="unit-mini" key={m.title}>
                          <div
                            className="ph ph--fine"
                            style={{ height: 64, position: m.featured ? 'relative' : undefined }}
                          >
                            {m.featured && (
                              <span
                                className="badge badge--solid-sand"
                                style={{ position: 'absolute', top: 6, insetInlineStart: 6 }}
                              >
                                FEATURED
                              </span>
                            )}
                          </div>
                          <div style={{ padding: 8 }}>
                            <b
                              style={{
                                display: 'block',
                                fontSize: 'var(--t-pico)',
                                color: 'var(--ink-900)',
                              }}
                            >
                              {m.title}
                            </b>
                            <span className="micro" style={{ fontSize: 'var(--t-pico)' }}>
                              {m.price}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="drop-line">
                      <span className="drop-line__tag">Drop &ldquo;Map by zone&rdquo; here</span>
                    </div>
                    <div className="drop-zone" />

                    <div className="dragging-card">
                      <div className="row row-gap-10" style={{ marginBottom: 8 }}>
                        <span className="grip" aria-hidden="true"><i /><i /><i /></span>
                        <b style={{ fontSize: 'var(--t-pico)', color: 'var(--ink-900)' }}>
                          Map by zone
                        </b>
                        <span
                          className="badge badge--palm"
                          style={{ marginInlineStart: 'auto', height: 18, fontSize: 10 }}
                        >
                          dragging
                        </span>
                      </div>
                      <div
                        className="ph ph--fine"
                        style={{ height: 70, borderRadius: 'var(--r-8)' }}
                      >
                        zone map
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lead-card">
                <p className="kicker" style={{ marginBottom: 6 }}>New lead · WhatsApp</p>
                <b style={{ fontSize: 'var(--t-micro)', color: 'var(--ink-900)' }}>Mai Farouk</b>
                <p className="micro" style={{ fontSize: 'var(--t-nano)', marginTop: 2 }}>
                  Asked about the Marassi chalet · 1 min ago
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ trust strip */}
        <section className="logos" aria-label="Developers whose units are listed on Alf Maskan">
          <div className="wrap logos__inner">
            <p className="kicker" style={{ whiteSpace: 'nowrap' }}>Units from</p>
            <ul className="logos__list">
              <li>EMAAR MISR</li>
              <li>SODIC</li>
              <li>PALM HILLS</li>
              <li>TALAAT MOUSTAFA GROUP</li>
              <li>ORA</li>
            </ul>
          </div>
        </section>

        {/* ============================================ value props */}
        <section className="section section--white">
          <div className="wrap grid grid--3">
            <div className="card card--pad value">
              <span className="value-icon">
                <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4 6.5h8M4 10.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <h3>One place for every unit</h3>
              <p className="body-sm">
                Add a unit once with photos, payment plan and finishing, and it appears on your
                site, your WhatsApp replies and your team&rsquo;s phones.
              </p>
            </div>

            <div className="card card--pad value">
              <span className="value-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <rect x="0" y="12" width="4" height="8" rx="1" fill="currentColor" />
                  <rect x="7" y="6" width="4" height="14" rx="1" fill="currentColor" />
                  <rect x="14" y="1" width="4" height="19" rx="1" fill="currentColor" />
                </svg>
              </span>
              <h3>A site that closes deals</h3>
              <p className="body-sm">
                Templates built for Egyptian buyers: payment plans up front, zone maps, and a
                WhatsApp button on every unit.
              </p>
            </div>

            <div className="card card--pad value">
              <span className="value-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <rect x="1" y="1" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.5" />
                  <text
                    x="11"
                    y="15.5"
                    textAnchor="middle"
                    fontFamily="IBM Plex Sans Arabic, sans-serif"
                    fontSize="11"
                    fontWeight="700"
                    fill="currentColor"
                  >
                    ع
                  </text>
                </svg>
              </span>
              <h3>Arabic first, English too</h3>
              <p className="body-sm">
                Write once and publish in both. The whole layout mirrors properly in Arabic —
                nothing looks translated.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================ demo */}
        <section
          className="section--white"
          style={{ paddingBottom: 'clamp(48px,6vw,80px)' }}
          id="demo"
        >
          <div className="wrap">
            <div className="demo">
              <div>
                <p className="eyebrow eyebrow--dim">How it works</p>
                <h2>See it built in 60 seconds</h2>
                <p className="body-sm" style={{ color: 'var(--on-dark-dim)', marginBottom: 24 }}>
                  Youssef Kamal signs up, imports 40 units from a spreadsheet, picks the Coastal
                  template and publishes at kamal-estates.alfmaskan.com. Filmed in one take.
                </p>
                <ol className="demo__steps">
                  <li><b>1</b> Import or add your units</li>
                  <li><b>2</b> Pick a template, drag sections</li>
                  <li><b>3</b> Publish and share on WhatsApp</li>
                </ol>
              </div>

              <button className="demo__video" type="button">
                <span className="play-lg">
                  <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden="true">
                    <path d="M0 0l22 13L0 26z" fill="currentColor" />
                  </svg>
                </span>
                <span className="visually-hidden">Play the 60-second product demo</span>
                <span className="demo__caption">product demo video · 16:9 · 0:60</span>
              </button>
            </div>
          </div>
        </section>

        {/* ============================================ template teaser */}
        <section className="section section--paper">
          <div className="wrap">
            <div className="section-head">
              <div>
                <h2 className="section-title">Every template. All yours.</h2>
                <p className="body">
                  Every template works in Arabic and English, on any phone, with your logo and
                  colours applied in one click.
                </p>
              </div>
              <a className="btn btn--secondary" href={demoStore}>
                See one running
                <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </a>
            </div>

            <div className="grid grid--4">
              {TEMPLATES.map((t) => (
                <div className={`card tpl-teaser${t.more ? ' tpl-teaser--more' : ''}`} key={t.name}>
                  <div className="ph">template screenshot</div>
                  <div className="tpl-teaser__body">
                    {t.premium ? (
                      <div className="row row-gap-10">
                        <h3>{t.name}</h3>
                        <span
                          className="badge badge--sand"
                          style={{ height: 20, fontSize: 10, fontWeight: 700 }}
                        >
                          PREMIUM
                        </span>
                      </div>
                    ) : (
                      <h3>{t.name}</h3>
                    )}
                    <p className="micro">{t.blurb}</p>
                  </div>
                  {t.more && <span className="tpl-teaser__fade">+7 more</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ feature deep-dive */}
        <section className="section section--white" id="features">
          <div className="wrap features">
            {FEATURES.map((f) => (
              <article className={`feature${f.flip ? ' feature--flip' : ''}`} id={f.id} key={f.id}>
                <div>
                  <p className="eyebrow">{f.eyebrow}</p>
                  <h2>{f.title}</h2>
                  <p className="body">{f.body}</p>
                  {f.extra}
                </div>
                <div className="feature__media feature__shot">
                  <div className="ph ph--4x3">{f.shot}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ============================================ testimonials */}
        <section className="section section--paper">
          <div className="wrap">
            <h2 className="section-title" style={{ marginBottom: 32 }}>
              Brokers who stopped paying for listings
            </h2>
            <div className="grid grid--3" style={{ gap: 24 }}>
              {QUOTES.map((q) => (
                <figure className="card quote" key={q.name}>
                  <blockquote>{q.quote}</blockquote>
                  <figcaption>
                    <span className={`avatar${q.alt ? ' avatar--alt' : ''}`} aria-hidden="true" />
                    <span>
                      <b
                        style={{
                          display: 'block',
                          fontSize: 'var(--t-meta)',
                          color: 'var(--ink-900)',
                        }}
                      >
                        {q.name}
                      </b>
                      <span className="micro">{q.where}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ stat band */}
        <section className="stats" aria-label="Alf Maskan by the numbers">
          <div className="wrap stats__inner">
            <div className="stat"><b>2,400+</b><span>units listed</span></div>
            <span className="stats__rule" aria-hidden="true" />
            <div className="stat"><b>180</b><span>agencies</span></div>
            <span className="stats__rule" aria-hidden="true" />
            <div className="stat"><b>11</b><span>governorates</span></div>
            <span className="stats__rule" aria-hidden="true" />
            <div className="stat stat--accent"><b>10 min</b><span>average time to publish</span></div>
          </div>
        </section>

        {/* ============================================ FAQ */}
        <section className="section section--white" id="faq">
          <div className="wrap faq-layout">
            <div>
              <h2 className="section-title" style={{ marginBottom: 12 }}>
                Questions brokers ask
              </h2>
              <p className="body-sm" style={{ marginBottom: 20 }}>
                Still unsure? Message us on WhatsApp and a real person replies in Arabic or
                English.
              </p>
              <a className="btn btn--secondary" href="https://wa.me/201002448817">
                Chat with us
              </a>
            </div>

            <Faq items={FAQ_ITEMS} />
          </div>
        </section>

        {/* ============================================ closing CTA */}
        <section className="section--white" style={{ paddingBottom: 'clamp(48px,6vw,80px)' }}>
          <div className="wrap">
            <div className="cta">
              <div className="cta__text">
                <h2>Put your first unit online tonight</h2>
                <p>
                  Fourteen days free, then EGP 990 a month. Cancel from the dashboard, no phone
                  call needed.
                </p>
              </div>
              <div className="cta__actions">
                <Link className="btn btn--lg btn--white" href="/dash">
                  Open the dashboard
                </Link>
                <a className="btn btn--lg btn--outline-light" href="https://wa.me/201002448817">
                  Book a 15-min walkthrough
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
