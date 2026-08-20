import "dotenv/config";

import { hashPassword } from "better-auth/crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import {
  AuthenticityType,
  CommissionRateChangeReason,
  ContentStatus,
  HomepageBlockType,
  Prisma,
  PrismaClient,
  ProductStatus,
} from "../src/generated/prisma";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const PERMISSIONS = [
  "orders.read",
  "orders.write",
  "orders.cancel",
  "payments.read",
  "payments.refund",
  "payments.manualMark",
  "products.read",
  "products.write",
  "products.cost.read",
  "inventory.read",
  "inventory.adjust",
  "customers.read",
  "customers.export",
  "content.write",
  "seo.write",
  "analytics.read",
  "finance.read",
  "commissions.read",
  "commissions.manage",
  "staff.manage",
  "settings.manage",
  "audit.read",
] as const;

const ROLES: { key: string; name: string; permissions: readonly string[] | "ALL" }[] = [
  { key: "OWNER", name: "Власник", permissions: "ALL" },
  { key: "DEVELOPER_ADMIN", name: "Розробник-адмін", permissions: "ALL" },
  { key: "SUPER_ADMIN", name: "Супер-адмін", permissions: "ALL" },
  {
    key: "SALES_MANAGER",
    name: "Менеджер продажів",
    permissions: [
      "orders.read",
      "orders.write",
      "orders.cancel",
      "payments.read",
      "payments.refund",
      "customers.read",
      "products.read",
    ],
  },
  {
    key: "WAREHOUSE_MANAGER",
    name: "Склад",
    permissions: ["inventory.read", "inventory.adjust", "orders.read", "products.read"],
  },
  {
    key: "CONTENT_MANAGER",
    name: "Контент",
    permissions: ["content.write", "products.read"],
  },
  {
    key: "SEO_MANAGER",
    name: "SEO",
    permissions: ["seo.write", "content.write", "analytics.read"],
  },
  {
    key: "MARKETING_MANAGER",
    name: "Маркетинг",
    permissions: ["analytics.read", "content.write", "customers.read"],
  },
  {
    key: "SUPPORT_MANAGER",
    name: "Підтримка",
    permissions: ["orders.read", "customers.read", "products.read"],
  },
  {
    key: "FINANCE_MANAGER",
    name: "Фінанси",
    permissions: ["finance.read", "payments.read", "commissions.read", "analytics.read"],
  },
];

const CATEGORIES = [
  { slug: "figures", name: "Фігурки", sortOrder: 1, imageUrl: "/categories/figures.png" },
  { slug: "cosplay", name: "Косплей", sortOrder: 2, imageUrl: "/banners/hero-03-cosplay.png" },
  { slug: "manga", name: "Манга", sortOrder: 3, imageUrl: "/products/starblade-notebook.png" },
  { slug: "apparel", name: "Одяг", sortOrder: 4, imageUrl: "/categories/apparel.png" },
  { slug: "posters", name: "Постери", sortOrder: 5, imageUrl: "/products/moonlit-poster-a2.png" },
  { slug: "stickers", name: "Наліпки", sortOrder: 6, imageUrl: "/categories/stickers.png" },
  { slug: "keychains", name: "Брелоки", sortOrder: 7, imageUrl: "/products/pixel-ronin-keychain.png" },
  { slug: "plush", name: "М'які іграшки", sortOrder: 8, imageUrl: "/products/void-garden-plush.png" },
  { slug: "accessories", name: "Аксесуари", sortOrder: 9, imageUrl: "/products/candy-rift-tote.png" },
  { slug: "gifts", name: "Подарунки", sortOrder: 10, imageUrl: "/products/moonlit-gift-box.png" },
];

const FANDOMS = [
  { slug: "neko-chronicles", name: "Neko Chronicles", sortOrder: 1 },
  { slug: "starblade-academy", name: "Starblade Academy", sortOrder: 2 },
  { slug: "moonlit-express", name: "Moonlit Express", sortOrder: 3 },
  { slug: "pixel-ronin", name: "Pixel Ronin", sortOrder: 4 },
  { slug: "candy-rift", name: "Candy Rift", sortOrder: 5 },
  { slug: "void-garden", name: "Void Garden", sortOrder: 6 },
];

type SeedProduct = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  categorySlug: string;
  fandomSlug: string;
  brandSlug: string;
  priceAmount: number;
  compareAtPriceAmount?: number;
  productType: string;
  authenticityType: AuthenticityType;
  isFeatured?: boolean;
  isNew?: boolean;
  salesCount?: number;
  variants: { sku: string; title: string; priceAmount: number; compareAtPriceAmount?: number; stock: number; isDefault?: boolean }[];
  imageHue: number;
  /** Local assets under /public/products */
  images?: string[];
};

const PRODUCTS: SeedProduct[] = [
  {
    slug: "neko-chan-figure",
    title: "Neko-chan Figure 1/7",
    shortDescription: "Колекційна фігурка з підставкою",
    description: "Оригінальна demo-фігурка Neko-chan. ПВХ, висота ~22 см, окрема підставка.",
    categorySlug: "figures",
    fandomSlug: "neko-chronicles",
    brandSlug: "da-studio",
    priceAmount: 249900,
    compareAtPriceAmount: 279900,
    productType: "figure",
    authenticityType: AuthenticityType.OFFICIAL,
    isFeatured: true,
    salesCount: 42,
    variants: [{ sku: "FIG-NEKO-01", title: "Стандарт", priceAmount: 249900, compareAtPriceAmount: 279900, stock: 12, isDefault: true }],
    imageHue: 330,
    images: [
      "/products/neko-chan-figure.png",
      "/products/neko-chan-figure-2.png",
      "/products/neko-chan-figure-3.png",
    ],
  },
  {
    slug: "kawaii-cat-hoodie",
    title: "Kawaii Cat Hoodie",
    shortDescription: "М'яке худі з принтом котика",
    description: "Унісекс худі з начосом. Demo-дизайн D&A, 80% бавовна.",
    categorySlug: "apparel",
    fandomSlug: "candy-rift",
    brandSlug: "da-studio",
    priceAmount: 129900,
    productType: "apparel",
    authenticityType: AuthenticityType.LICENSED,
    isFeatured: true,
    isNew: true,
    salesCount: 28,
    variants: [
      { sku: "APP-HOOD-S", title: "S", priceAmount: 129900, stock: 8, isDefault: true },
      { sku: "APP-HOOD-M", title: "M", priceAmount: 129900, stock: 14 },
      { sku: "APP-HOOD-L", title: "L", priceAmount: 129900, stock: 6 },
      { sku: "APP-HOOD-XL", title: "XL", priceAmount: 129900, stock: 3 },
    ],
    imageHue: 340,
    images: ["/products/kawaii-cat-hoodie.png"],
  },
  {
    slug: "starblade-notebook",
    title: "Starblade Academy Notebook",
    shortDescription: "Зошит у клітинку з твердою обкладинкою",
    description: "A5, 96 аркушів. Фантомний фендом Starblade Academy — безпечний demo-контент.",
    categorySlug: "manga",
    fandomSlug: "starblade-academy",
    brandSlug: "paper-pulse",
    priceAmount: 34900,
    productType: "stationery",
    authenticityType: AuthenticityType.FAN_MADE,
    isNew: true,
    salesCount: 55,
    variants: [{ sku: "STA-NB-01", title: "A5", priceAmount: 34900, stock: 40, isDefault: true }],
    imageHue: 260,
    images: ["/products/starblade-notebook.png", "/products/starblade-notebook-2.png"],
  },
  {
    slug: "moonlit-poster-a2",
    title: "Moonlit Express Poster A2",
    shortDescription: "Постер на матовому папері",
    description: "A2 постер із нейтральною ілюстрацією потяга під місяцем.",
    categorySlug: "posters",
    fandomSlug: "moonlit-express",
    brandSlug: "paper-pulse",
    priceAmount: 44900,
    compareAtPriceAmount: 54900,
    productType: "poster",
    authenticityType: AuthenticityType.LICENSED,
    salesCount: 33,
    variants: [{ sku: "POS-ME-A2", title: "A2", priceAmount: 44900, compareAtPriceAmount: 54900, stock: 25, isDefault: true }],
    imageHue: 220,
    images: ["/products/moonlit-poster-a2.png", "/products/moonlit-poster-a2-2.png"],
  },
  {
    slug: "pixel-ronin-keychain",
    title: "Pixel Ronin Keychain",
    shortDescription: "Акриловий брелок",
    description: "Двосторонній акриловий брелок з кільцем.",
    categorySlug: "keychains",
    fandomSlug: "pixel-ronin",
    brandSlug: "da-studio",
    priceAmount: 19900,
    productType: "keychain",
    authenticityType: AuthenticityType.OFFICIAL,
    isFeatured: true,
    salesCount: 90,
    variants: [{ sku: "KEY-PR-01", title: "Standard", priceAmount: 19900, stock: 80, isDefault: true }],
    imageHue: 10,
    images: ["/products/pixel-ronin-keychain.png", "/products/neko-cat-keychain.png"],
  },
  {
    slug: "void-garden-plush",
    title: "Void Garden Plush 25cm",
    shortDescription: "М'яка іграшка-супутник",
    description: "Плюш 25 см, гіпоалергенний наповнювач. Demo-персонаж Void Bloom.",
    categorySlug: "plush",
    fandomSlug: "void-garden",
    brandSlug: "soft-orbit",
    priceAmount: 89900,
    productType: "plush",
    authenticityType: AuthenticityType.OFFICIAL,
    isNew: true,
    salesCount: 19,
    variants: [{ sku: "PLU-VG-25", title: "25cm", priceAmount: 89900, stock: 18, isDefault: true }],
    imageHue: 280,
    images: ["/products/void-garden-plush.png"],
  },
  {
    slug: "neko-sticker-pack",
    title: "Neko Sticker Pack (12 pcs)",
    shortDescription: "Набір вінілових наліпок",
    description: "12 водостійких наліпок з демо-іконками Neko Chronicles.",
    categorySlug: "stickers",
    fandomSlug: "neko-chronicles",
    brandSlug: "da-studio",
    priceAmount: 14900,
    productType: "sticker",
    authenticityType: AuthenticityType.FAN_MADE,
    salesCount: 120,
    variants: [{ sku: "STK-NEKO-12", title: "Pack", priceAmount: 14900, stock: 100, isDefault: true }],
    imageHue: 350,
    images: ["/products/neko-sticker-pack.png"],
  },
  {
    slug: "starblade-cosplay-jacket",
    title: "Starblade Cosplay Jacket",
    shortDescription: "Жакет для косплею з розмірною сіткою",
    description: "Демо-костюмний жакет. Розміри S–XL. Повний комплект без аксесуарів.",
    categorySlug: "cosplay",
    fandomSlug: "starblade-academy",
    brandSlug: "stagecraft",
    priceAmount: 319900,
    productType: "cosplay",
    authenticityType: AuthenticityType.LICENSED,
    isFeatured: true,
    salesCount: 7,
    variants: [
      { sku: "COS-SB-S", title: "S / жіночий", priceAmount: 319900, stock: 2, isDefault: true },
      { sku: "COS-SB-M", title: "M / жіночий", priceAmount: 319900, stock: 3 },
      { sku: "COS-SB-L", title: "L / унісекс", priceAmount: 329900, stock: 2 },
      { sku: "COS-SB-XL", title: "XL / унісекс", priceAmount: 329900, stock: 1 },
    ],
    imageHue: 200,
    images: [
      "/products/starblade-cosplay-jacket.png",
      "/products/starblade-cosplay-jacket-2.png",
    ],
  },
  {
    slug: "candy-rift-tote",
    title: "Candy Rift Tote Bag",
    shortDescription: "Бавовняний шопер",
    description: "Місткий шопер з двостороннім принтом Candy Rift.",
    categorySlug: "accessories",
    fandomSlug: "candy-rift",
    brandSlug: "da-studio",
    priceAmount: 59900,
    productType: "accessory",
    authenticityType: AuthenticityType.OFFICIAL,
    isNew: true,
    salesCount: 22,
    variants: [{ sku: "ACC-CR-TOTE", title: "One size", priceAmount: 59900, stock: 30, isDefault: true }],
    imageHue: 320,
    images: ["/products/candy-rift-tote.png"],
  },
  {
    slug: "moonlit-gift-box",
    title: "Moonlit Gift Box",
    shortDescription: "Подарунковий набір: постер + брелок + стікери",
    description: "Комплект для подарунка. Упаковка входить у вартість.",
    categorySlug: "gifts",
    fandomSlug: "moonlit-express",
    brandSlug: "da-studio",
    priceAmount: 99900,
    compareAtPriceAmount: 119900,
    productType: "bundle",
    authenticityType: AuthenticityType.OFFICIAL,
    isFeatured: true,
    salesCount: 15,
    variants: [{ sku: "GFT-ME-BOX", title: "Box", priceAmount: 99900, compareAtPriceAmount: 119900, stock: 10, isDefault: true }],
    imageHue: 190,
    images: ["/products/moonlit-gift-box.png"],
  },
  {
    slug: "pixel-ronin-mousepad",
    title: "Pixel Ronin Mousepad XL",
    shortDescription: "Ігровий килимок 90×40",
    description: "Прогумований низ, гладка поверхня. Demo-арт Pixel Ronin.",
    categorySlug: "accessories",
    fandomSlug: "pixel-ronin",
    brandSlug: "soft-orbit",
    priceAmount: 74900,
    productType: "accessory",
    authenticityType: AuthenticityType.LICENSED,
    salesCount: 18,
    variants: [{ sku: "ACC-PR-PAD", title: "XL", priceAmount: 74900, stock: 16, isDefault: true }],
    imageHue: 25,
    images: ["/products/pixel-ronin-mousepad.png"],
  },
  {
    slug: "void-garden-pin-set",
    title: "Void Garden Enamel Pins (3)",
    shortDescription: "Набір металевих пінів",
    description: "Три емалеві піни з застібками-метеликами.",
    categorySlug: "accessories",
    fandomSlug: "void-garden",
    brandSlug: "da-studio",
    priceAmount: 39900,
    productType: "pin",
    authenticityType: AuthenticityType.OFFICIAL,
    isNew: true,
    salesCount: 41,
    variants: [{ sku: "PIN-VG-3", title: "Set", priceAmount: 39900, stock: 35, isDefault: true }],
    imageHue: 270,
    images: ["/products/void-garden-pin-set.png"],
  },
];

function buildSearchText(parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function placeholderSvg(title: string, hue: number) {
  const safe = title.replace(/[<>&]/g, "");
  return `/api/placeholder?title=${encodeURIComponent(safe)}&hue=${hue}`;
}

async function seedCatalog() {
  const brands = [
    { slug: "da-studio", name: "D&A Studio" },
    { slug: "paper-pulse", name: "Paper Pulse" },
    { slug: "soft-orbit", name: "Soft Orbit" },
    { slug: "stagecraft", name: "Stagecraft" },
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: { name: brand.name, isActive: true },
      create: brand,
    });
  }

  for (const fandom of FANDOMS) {
    await prisma.fandom.upsert({
      where: { slug: fandom.slug },
      update: { name: fandom.name, sortOrder: fandom.sortOrder, isActive: true },
      create: fandom,
    });
  }

  const sizeOption = await prisma.optionDefinition.upsert({
    where: { key: "size" },
    update: { name: "Розмір" },
    create: { key: "size", name: "Розмір", sortOrder: 1 },
  });

  for (const [i, value] of ["XS", "S", "M", "L", "XL"].entries()) {
    await prisma.optionValue.upsert({
      where: { optionId_value: { optionId: sizeOption.id, value } },
      update: { sortOrder: i },
      create: { optionId: sizeOption.id, value, sortOrder: i },
    });
  }

  const warehouse = await prisma.warehouse.findUniqueOrThrow({ where: { code: "MAIN" } });
  const categoryMap = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.slug, c]),
  );
  const fandomMap = Object.fromEntries((await prisma.fandom.findMany()).map((f) => [f.slug, f]));
  const brandMap = Object.fromEntries((await prisma.brand.findMany()).map((b) => [b.slug, b]));

  for (const item of PRODUCTS) {
    const category = categoryMap[item.categorySlug];
    const fandom = fandomMap[item.fandomSlug];
    const brand = brandMap[item.brandSlug];
    if (!category || !fandom || !brand) continue;

    const searchText = buildSearchText([
      item.title,
      item.shortDescription,
      item.productType,
      category.name,
      fandom.name,
      brand.name,
      ...item.variants.map((v) => v.sku),
    ]);

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        shortDescription: item.shortDescription,
        description: item.description,
        status: ProductStatus.PUBLISHED,
        productType: item.productType,
        authenticityType: item.authenticityType,
        primaryCategoryId: category.id,
        fandomId: fandom.id,
        brandId: brand.id,
        priceAmount: item.priceAmount,
        compareAtPriceAmount: item.compareAtPriceAmount ?? null,
        isFeatured: item.isFeatured ?? false,
        isNew: item.isNew ?? false,
        salesCount: item.salesCount ?? 0,
        publishedAt: new Date(),
        searchText,
      },
      create: {
        slug: item.slug,
        title: item.title,
        shortDescription: item.shortDescription,
        description: item.description,
        status: ProductStatus.PUBLISHED,
        productType: item.productType,
        authenticityType: item.authenticityType,
        primaryCategoryId: category.id,
        fandomId: fandom.id,
        brandId: brand.id,
        priceAmount: item.priceAmount,
        compareAtPriceAmount: item.compareAtPriceAmount ?? null,
        isFeatured: item.isFeatured ?? false,
        isNew: item.isNew ?? false,
        salesCount: item.salesCount ?? 0,
        publishedAt: new Date(),
        searchText,
        categories: { create: [{ categoryId: category.id }] },
      },
    });

    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: product.id, categoryId: category.id } },
      update: {},
      create: { productId: product.id, categoryId: category.id },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    const imageUrls =
      item.images?.length ? item.images : [placeholderSvg(item.title, item.imageHue)];
    for (const [index, url] of imageUrls.entries()) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url,
          alt: item.title,
          isPrimary: index === 0,
          sortOrder: index,
        },
      });
    }

    for (const [index, variant] of item.variants.entries()) {
      const saved = await prisma.productVariant.upsert({
        where: { sku: variant.sku },
        update: {
          title: variant.title,
          priceAmount: variant.priceAmount,
          compareAtPriceAmount: variant.compareAtPriceAmount ?? null,
          isDefault: variant.isDefault ?? index === 0,
          isActive: true,
          productId: product.id,
        },
        create: {
          productId: product.id,
          sku: variant.sku,
          title: variant.title,
          priceAmount: variant.priceAmount,
          compareAtPriceAmount: variant.compareAtPriceAmount ?? null,
          isDefault: variant.isDefault ?? index === 0,
          isActive: true,
          sortOrder: index,
        },
      });

      await prisma.inventoryItem.upsert({
        where: {
          warehouseId_variantId: { warehouseId: warehouse.id, variantId: saved.id },
        },
        update: { onHand: variant.stock, reserved: 0 },
        create: {
          warehouseId: warehouse.id,
          variantId: saved.id,
          onHand: variant.stock,
          reserved: 0,
          reorderPoint: 2,
        },
      });
    }
  }

  const collection = await prisma.collection.upsert({
    where: { slug: "staff-picks" },
    update: { name: "Вибір команди", isActive: true },
    create: {
      slug: "staff-picks",
      name: "Вибір команди",
      description: "Ручна колекція хітів магазина",
      type: "MANUAL",
      isActive: true,
    },
  });

  const featured = await prisma.product.findMany({
    where: { isFeatured: true, status: ProductStatus.PUBLISHED },
    take: 6,
  });

  for (const [i, product] of featured.entries()) {
    await prisma.collectionProduct.upsert({
      where: {
        collectionId_productId: { collectionId: collection.id, productId: product.id },
      },
      update: { sortOrder: i },
      create: { collectionId: collection.id, productId: product.id, sortOrder: i },
    });
  }
}

async function seedContent() {
  const blocks: {
    key: string;
    type: HomepageBlockType;
    title?: string;
    subtitle?: string;
    sortOrder: number;
    isEnabled?: boolean;
    config: Prisma.InputJsonValue;
  }[] = [
    {
      key: "hero",
      type: HomepageBlockType.HERO,
      title: "Anime merch для щоденного вайбу",
      subtitle: "Мерч, фігурки й манга — мрії, що можна взяти з собою.",
      sortOrder: 10,
      config: {
        brandLabel: "D&A",
        brandExpansion: "Dreams & Anime",
        headline: "Anime merch для щоденного вайбу",
        support: "Мерч, фігурки й манга — мрії, що можна взяти з собою.",
        primaryCtaLabel: "Каталог",
        primaryCtaHref: "/catalog",
        secondaryCtaLabel: "Вибір команди",
        secondaryCtaHref: "/collection/staff-picks",
        imageUrl: "/banners/hero-01-neko.png",
        imageAlt: "D&A — Neko-chan figure",
        autoplayMs: 6500,
        slides: [
          {
            imageUrl: "/banners/hero-01-neko.png",
            imageAlt: "Neko-chan figure collection",
            href: "/product/neko-chan-figure",
          },
          {
            imageUrl: "/banners/hero-02-hoodie.png",
            imageAlt: "Kawaii Cat Hoodie drop",
            href: "/product/kawaii-cat-hoodie",
          },
          {
            imageUrl: "/banners/hero-03-cosplay.png",
            imageAlt: "Starblade cosplay jacket",
            href: "/product/starblade-cosplay-jacket",
          },
          {
            imageUrl: "/banners/hero-04-giftbox.png",
            imageAlt: "Moonlit gift box",
            href: "/product/moonlit-gift-box",
          },
        ],
      },
    },
    {
      key: "categories",
      type: HomepageBlockType.CATEGORY_STRIP,
      sortOrder: 20,
      config: {},
    },
    {
      key: "benefits",
      type: HomepageBlockType.BENEFITS,
      sortOrder: 30,
      config: {
        items: [
          { title: "Швидка доставка", text: "Відправка 1–2 робочі дні", icon: "package" },
          { title: "Подарунки", text: "Сюрприз до кожного замовлення", icon: "gift" },
          { title: "100% оригінал", text: "Перевірені постачальники", icon: "shield" },
          { title: "Підтримка", text: "Допоможемо з розміром і вибором", icon: "headphones" },
        ],
      },
    },
    {
      key: "featured",
      type: HomepageBlockType.PRODUCT_GRID_FEATURED,
      title: "Хіти продажів",
      subtitle: "Товари з найбільшим інтересом цього місяця",
      sortOrder: 40,
      config: {
        limit: 4,
        linkHref: "/catalog?sort=popular",
        linkLabel: "Усі товари",
      },
    },
    {
      key: "for-you",
      type: HomepageBlockType.PRODUCT_GRID_FOR_YOU,
      title: "Для вас",
      subtitle: "Персональна підбірка",
      sortOrder: 45,
      config: {
        limit: 4,
        linkHref: "/catalog",
        linkLabel: "Весь каталог",
      },
    },
    {
      key: "newest",
      type: HomepageBlockType.PRODUCT_GRID_NEW,
      title: "Новинки",
      subtitle: "Свіжі надходження на складі",
      sortOrder: 50,
      config: {
        limit: 4,
        linkHref: "/catalog?sort=newest",
        linkLabel: "Дивитись усі",
      },
    },
    {
      key: "blog-cta",
      type: HomepageBlockType.CTA_BANNER,
      title: "Читай блог D&A",
      subtitle: "Dreams & Anime: підбірки, гайди та новини",
      sortOrder: 60,
      isEnabled: false,
      config: {
        label: "До блогу",
        href: "/blog",
        tone: "primary",
      },
    },
  ];

  for (const block of blocks) {
    await prisma.homepageBlock.upsert({
      where: { key: block.key },
      update: {
        type: block.type,
        title: block.title,
        subtitle: block.subtitle,
        sortOrder: block.sortOrder,
        isEnabled: block.isEnabled ?? true,
        config: block.config,
      },
      create: {
        key: block.key,
        type: block.type,
        title: block.title,
        subtitle: block.subtitle,
        sortOrder: block.sortOrder,
        isEnabled: block.isEnabled ?? true,
        config: block.config,
      },
    });
  }

  const posts = [
    {
      slug: "welcome-to-da",
      title: "Ласкаво просимо до D&A",
      excerpt: "D&A — Dreams & Anime: чому ми відкрили магазин і що далі.",
      body: "D&A читається як Dreams & Anime — мрії та аніме в одній вітрині.\n\nМи збираємо мерч, фігурки, мангу й косплей, щоб покупки були швидкими, зрозумілими і з підтримкою українською.\n\nСлідкуйте за блогом: гіди по розмірах, дропи й підбірки подарунків.",
      authorName: "Команда D&A",
      coverImageUrl: "/banners/hero-01-neko.png",
    },
    {
      slug: "how-to-choose-figure-scale",
      title: "Як обрати масштаб фігурки",
      excerpt: "Короткий гайд: 1/7, 1/8, Nendoroid і що краще для полиці.",
      body: "Масштаб фігурки впливає і на ціну, і на те, скільки місця вона займе вдома.\n\n1/7 — класика для вітрин. 1/8 компактніше. Nendoroid / chibi зручні, якщо хочеться колекцію без великих полиць.\n\nПеред замовленням дивіться розміри в картці товару і порівняйте з місцем, яке вже є.",
      authorName: "Команда D&A",
      coverImageUrl: "/banners/hero-03-cosplay.png",
    },
  ];

  for (const post of posts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        authorName: post.authorName,
        coverImageUrl: post.coverImageUrl,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        seoTitle: post.title,
        seoDescription: post.excerpt,
      },
      create: {
        ...post,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        seoTitle: post.title,
        seoDescription: post.excerpt,
      },
    });
  }

  await prisma.seoMeta.upsert({
    where: { entityType_entityId: { entityType: "home", entityId: "home" } },
    update: {
      title: "D&A — Dreams & Anime Shop",
      description:
        "Інтернет-магазин аніме-атрибутики, мерчу, фігурок, манги та косплею з доставкою по Україні.",
      canonicalPath: "/",
      noindex: false,
    },
    create: {
      entityType: "home",
      entityId: "home",
      title: "D&A — Dreams & Anime Shop",
      description:
        "Інтернет-магазин аніме-атрибутики, мерчу, фігурок, манги та косплею з доставкою по Україні.",
      canonicalPath: "/",
      noindex: false,
    },
  });

  await prisma.redirect.upsert({
    where: { fromPath: "/shop" },
    update: { toPath: "/catalog", statusCode: 301, isActive: true },
    create: {
      fromPath: "/shop",
      toPath: "/catalog",
      statusCode: 301,
      isActive: true,
      note: "Legacy shop URL",
    },
  });
}

async function seedCommission() {
  const startsAt = new Date("2026-01-01T00:00:00.000Z");

  await prisma.commissionAgreement.updateMany({
    where: { name: { not: "D&A Developer Agreement" }, isActive: true },
    data: { isActive: false },
  });

  const existing = await prisma.commissionAgreement.findFirst({
    where: { name: "D&A Developer Agreement" },
  });

  const agreement =
    existing ??
    (await prisma.commissionAgreement.create({
      data: {
        name: "D&A Developer Agreement",
        startsAt,
        yearOneRateBps: 700,
        ongoingRateBps: 400,
        payoffTargetAmount: 500_000_00, // 500 000 UAH
        eligibleSources: ["WEBSITE"],
        isActive: true,
        notes: "7% year one / 4% after year or payoff target.",
      },
    }));

  if (existing) {
    await prisma.commissionAgreement.update({
      where: { id: existing.id },
      data: {
        yearOneRateBps: 700,
        ongoingRateBps: 400,
        payoffTargetAmount: 500_000_00,
        eligibleSources: ["WEBSITE"],
        isActive: true,
      },
    });
  }

  const openPeriod = await prisma.commissionRatePeriod.findFirst({
    where: { agreementId: agreement.id, endsAt: null },
  });
  if (!openPeriod) {
    await prisma.commissionRatePeriod.create({
      data: {
        agreementId: agreement.id,
        rateBps: 700,
        startsAt,
        reason: CommissionRateChangeReason.MANUAL,
        note: "Initial year-one rate",
      },
    });
  }
}

async function main() {
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: key },
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const permissionByKey = new Map(allPermissions.map((p) => [p.key, p.id]));

  for (const role of ROLES) {
    const created = await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name },
      create: { key: role.key, name: role.name },
    });

    const keys = role.permissions === "ALL" ? [...PERMISSIONS] : [...role.permissions];
    for (const permKey of keys) {
      const permissionId = permissionByKey.get(permKey);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: created.id, permissionId } },
        update: {},
        create: { roleId: created.id, permissionId },
      });
    }
  }

  await prisma.storeSetting.upsert({
    where: { key: "store.name" },
    update: { value: "D&A" },
    create: { key: "store.name", value: "D&A" },
  });
  await prisma.storeSetting.upsert({
    where: { key: "store.tagline" },
    update: { value: "Dreams & Anime" },
    create: { key: "store.tagline", value: "Dreams & Anime" },
  });
  await prisma.storeSetting.upsert({
    where: { key: "store.promoBar" },
    update: {
      value: {
        text: "D&A · Dreams & Anime · Безкоштовна доставка від 1500 ₴ · Подарунок до замовлення",
        enabled: true,
      },
    },
    create: {
      key: "store.promoBar",
      value: {
        text: "D&A · Dreams & Anime · Безкоштовна доставка від 1500 ₴ · Подарунок до замовлення",
        enabled: true,
      },
    },
  });

  await prisma.warehouse.upsert({
    where: { code: "MAIN" },
    update: { name: "Основний склад", isDefault: true },
    create: { code: "MAIN", name: "Основний склад", isDefault: true },
  });

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: true,
        imageUrl: category.imageUrl,
      },
      create: {
        slug: category.slug,
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: true,
        imageUrl: category.imageUrl,
      },
    });
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@kawaiko.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe_Admin_123!";
  const hashed = await hashPassword(password);

  let admin = await prisma.user.findUnique({ where: { email } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: "Admin",
        email,
        emailVerified: true,
        accounts: {
          create: {
            accountId: email,
            providerId: "credential",
            password: hashed,
          },
        },
        staffProfile: { create: { isActive: true } },
      },
    });
  }

  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "OWNER" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: ownerRole.id } },
    update: {},
    create: { userId: admin.id, roleId: ownerRole.id },
  });

  await seedCatalog();

  await seedContent();

  await seedCommission();

  await prisma.coupon.upsert({
    where: { code: "WELCOME15" },
    update: {
      type: "PERCENTAGE",
      percentOff: 15,
      isActive: true,
    },
    create: {
      code: "WELCOME15",
      type: "PERCENTAGE",
      percentOff: 15,
      isActive: true,
    },
  });

  await seedReviews();

  console.info(`Seed complete. Admin: ${email}. Catalog products: ${PRODUCTS.length}`);
}

async function seedReviews() {
  const samples = [
    {
      slug: "neko-chan-figure",
      rating: 5,
      title: "Ідеальна фігурка",
      body: "Якість зборки супер, фарба рівна. Доставили швидко, упаковка надійна.",
      authorName: "Олена",
    },
    {
      slug: "kawaii-cat-hoodie",
      rating: 4,
      title: "Мʼякий і теплый",
      body: "Тканина приємна, принт не потріскався після прання. Розмір трохи oversize — як і очікувала.",
      authorName: "Марія",
    },
    {
      slug: "void-garden-plush",
      rating: 5,
      title: "Обнімашко дня",
      body: "Дуже милий плюш, саме як на фото. Подарувала подрузі — у захваті.",
      authorName: "Андрій",
    },
  ];

  for (const sample of samples) {
    const product = await prisma.product.findUnique({ where: { slug: sample.slug } });
    if (!product) continue;

    const existing = await prisma.review.findFirst({
      where: {
        productId: product.id,
        authorName: sample.authorName,
        body: sample.body,
      },
    });
    if (existing) continue;

    await prisma.review.create({
      data: {
        productId: product.id,
        rating: sample.rating,
        title: sample.title,
        body: sample.body,
        authorName: sample.authorName,
        status: "APPROVED",
        moderatedAt: new Date(),
      },
    });

    const agg = await prisma.review.aggregate({
      where: { productId: product.id, status: "APPROVED" },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: {
        averageRating: agg._avg.rating,
        reviewCount: agg._count._all,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
