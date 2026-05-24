import { ItemStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
});

type StoreSeed = {
  slug: string;
  name: string;
  city: string;
  area?: string;
  description?: string;
  story?: string;
  imageUrl?: string;
};

type ItemSeed = {
  slug: string;
  title: string;
  brand: string;
  category: string;
  size: string;
  condition: string;
  price: number;
  currency: string;
  imageUrl: string;
  imageAlt: string;
  description: string;
  material: string;
  color: string;
  era: string;
  fit: string;
  measurements: string;
  curatorNote: string;
  storeSlug: string;
  isFeatured: boolean;
  status?: ItemStatus;
};

const stores: StoreSeed[] = [
  {
    slug: "north-archive",
    name: "North Archive",
    city: "Stockholm",
    area: "Sodermalm",
    description: "Workwear, denim and quiet vintage essentials.",
    story:
      "A small studio focused on honest workwear, softened denim and calm tonal pieces that only get better with wear.",
    imageUrl:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    slug: "slow-finds",
    name: "Slow Finds",
    city: "Saint Petersburg",
    area: "Petrogradskaya",
    description: "Curated vintage and quiet luxury wardrobe staples.",
    story:
      "Curated rails of one-of-one pieces selected for calm silhouettes, good fabrics and effortless layering.",
    imageUrl:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80",
  },
  {
    slug: "rack-no-7",
    name: "Rack No. 7",
    city: "Moscow",
    area: "Chistye Prudy",
    description: "Rare outerwear and preppy minimal classics.",
    story:
      "Known for precise outerwear picks and old-money inspired tailoring that instantly elevates a simple look.",
    imageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    slug: "sunday-archive",
    name: "Sunday Archive",
    city: "Tbilisi",
    area: "Vera",
    description: "Soft knits, wool textures and elegant accessories.",
    story:
      "A light and tactile curation of vintage knitwear, bags and wool layers in gentle, wearable shades.",
    imageUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
  },
];

const items: ItemSeed[] = [
  {
    slug: "carhartt-detroit-jacket",
    title: "Detroit Jacket",
    brand: "Carhartt",
    category: "Outerwear",
    size: "L",
    condition: "Excellent",
    price: 4900,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Vintage canvas workwear jacket",
    description:
      "A classic Detroit shape in washed canvas with a grounded silhouette and subtle patina.",
    material: "Cotton canvas",
    color: "Sand",
    era: "Late 1990s",
    fit: "Boxy",
    measurements: "Shoulders 50 cm, chest 61 cm, length 67 cm",
    curatorNote:
      "The kind of jacket that looks better every season. Strong shape, honest wear, easy to style.",
    storeSlug: "north-archive",
    isFeatured: true,
  },
  {
    slug: "levis-501-vintage-denim",
    title: "501 Vintage Denim",
    brand: "Levi's",
    category: "Denim",
    size: "W32",
    condition: "Very good",
    price: 3600,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Vintage straight leg blue denim jeans",
    description:
      "Balanced fading, straight leg and crisp rise for an effortless everyday silhouette.",
    material: "100% cotton denim",
    color: "Vintage blue",
    era: "Early 1990s",
    fit: "Straight",
    measurements: "Waist 82 cm, rise 30 cm, inseam 77 cm",
    curatorNote:
      "Not too clean, not too destroyed — exactly the balance you want in vintage denim.",
    storeSlug: "north-archive",
    isFeatured: true,
  },
  {
    slug: "burberry-wool-coat",
    title: "Wool Coat",
    brand: "Burberry",
    category: "Outerwear",
    size: "M",
    condition: "Excellent",
    price: 11900,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1525457136159-8878648a7ad0?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Long dark wool overcoat",
    description:
      "Refined longline coat with dense wool texture and a clean shoulder profile.",
    material: "Wool blend",
    color: "Charcoal",
    era: "2000s",
    fit: "Regular",
    measurements: "Shoulders 47 cm, chest 57 cm, length 114 cm",
    curatorNote:
      "Quiet, expensive-looking and easy to wear. The piece that makes the whole outfit calmer.",
    storeSlug: "rack-no-7",
    isFeatured: true,
  },
  {
    slug: "adidas-samba-sneakers",
    title: "Samba Sneakers",
    brand: "Adidas",
    category: "Footwear",
    size: "EU 42",
    condition: "Good",
    price: 4200,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Cream Adidas Samba sneakers",
    description:
      "Terrace icon with supple leather upper and softly aged gum sole.",
    material: "Leather",
    color: "Cream / Gum",
    era: "2010s",
    fit: "True to size",
    measurements: "Insole 27 cm",
    curatorNote:
      "A one-of-one find with enough character to carry a simple outfit.",
    storeSlug: "slow-finds",
    isFeatured: false,
  },
  {
    slug: "ralph-lauren-oxford-shirt",
    title: "Oxford Shirt",
    brand: "Ralph Lauren",
    category: "Shirts",
    size: "M",
    condition: "Excellent",
    price: 2900,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Blue Oxford button-up shirt",
    description:
      "Lightly structured Oxford shirt that works equally well tucked in or layered open.",
    material: "Oxford cotton",
    color: "Sky blue",
    era: "2000s",
    fit: "Relaxed",
    measurements: "Shoulders 47 cm, chest 58 cm, length 76 cm",
    curatorNote:
      "The type of clean basic you buy once and keep in rotation for years.",
    storeSlug: "slow-finds",
    isFeatured: false,
  },
  {
    slug: "acne-studios-knit-sweater",
    title: "Knit Sweater",
    brand: "Acne Studios",
    category: "Knitwear",
    size: "S",
    condition: "Very good",
    price: 6800,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Soft neutral Acne Studios knit",
    description:
      "Brushed knit with subtle volume and soft hand-feel for understated layering.",
    material: "Wool / mohair blend",
    color: "Stone",
    era: "2010s",
    fit: "Relaxed",
    measurements: "Shoulders 50 cm, chest 56 cm, length 62 cm",
    curatorNote:
      "Soft texture, muted tone, no noise — exactly what a modern vintage knit should feel like.",
    storeSlug: "sunday-archive",
    isFeatured: true,
  },
  {
    slug: "nike-acg-fleece",
    title: "ACG Fleece",
    brand: "Nike",
    category: "Sportswear",
    size: "L",
    condition: "Excellent",
    price: 5100,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Green technical fleece zip-up",
    description:
      "Functional fleece layer with practical pockets and lightweight warmth.",
    material: "Polyester fleece",
    color: "Forest",
    era: "2010s",
    fit: "Relaxed",
    measurements: "Shoulders 52 cm, chest 62 cm, length 70 cm",
    curatorNote:
      "Technical enough for outdoors, clean enough for city looks.",
    storeSlug: "north-archive",
    isFeatured: false,
  },
  {
    slug: "dr-martens-1461",
    title: "1461 Shoes",
    brand: "Dr. Martens",
    category: "Footwear",
    size: "EU 43",
    condition: "Good",
    price: 5700,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Black leather Dr. Martens 1461 shoes",
    description:
      "Three-eye leather staple with light creasing and durable sole structure.",
    material: "Smooth leather",
    color: "Black",
    era: "2000s",
    fit: "True to size",
    measurements: "Insole 28 cm",
    curatorNote:
      "This pair already has the break-in done for you — just wear and go.",
    storeSlug: "rack-no-7",
    isFeatured: false,
  },
  {
    slug: "cos-minimalist-blazer",
    title: "Minimalist Blazer",
    brand: "COS",
    category: "Tailoring",
    size: "M",
    condition: "Excellent",
    price: 6300,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Taupe minimalist wool blazer",
    description:
      "Unstructured tailoring with modern lapel line and fluid drape.",
    material: "Wool blend",
    color: "Taupe",
    era: "2010s",
    fit: "Relaxed",
    measurements: "Shoulders 45 cm, chest 55 cm, length 74 cm",
    curatorNote:
      "A calm blazer that sharpens denim, knitwear and even sneakers.",
    storeSlug: "slow-finds",
    isFeatured: true,
  },
  {
    slug: "vintage-leather-bag",
    title: "Vintage Leather Bag",
    brand: "Atelier Vintage",
    category: "Accessories",
    size: "One size",
    condition: "Very good",
    price: 4400,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Brown vintage leather shoulder bag",
    description:
      "Structured shoulder bag with soft patina and practical everyday interior.",
    material: "Genuine leather",
    color: "Dark brown",
    era: "1990s",
    fit: "Shoulder carry",
    measurements: "Width 28 cm, height 19 cm, depth 9 cm",
    curatorNote:
      "The bag that quietly anchors a full look without asking for attention.",
    storeSlug: "sunday-archive",
    isFeatured: false,
  },
  {
    slug: "stone-island-overshirt",
    title: "Overshirt",
    brand: "Stone Island",
    category: "Outerwear",
    size: "L",
    condition: "Excellent",
    price: 9800,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Olive cotton overshirt with utility pockets",
    description:
      "Garment-dyed overshirt with subtle texture and military-inspired functionality.",
    material: "Cotton twill",
    color: "Olive",
    era: "2010s",
    fit: "Regular",
    measurements: "Shoulders 48 cm, chest 59 cm, length 73 cm",
    curatorNote:
      "A tactical classic that still reads polished when paired with clean trousers.",
    storeSlug: "rack-no-7",
    isFeatured: true,
  },
  {
    slug: "patagonia-synchilla-fleece",
    title: "Synchilla Fleece",
    brand: "Patagonia",
    category: "Sportswear",
    size: "M",
    condition: "Very good",
    price: 4700,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Navy Patagonia fleece pullover",
    description:
      "Cozy heritage fleece with snap placket and a relaxed mountain fit.",
    material: "Recycled polyester",
    color: "Navy",
    era: "2000s",
    fit: "Relaxed",
    measurements: "Shoulders 49 cm, chest 58 cm, length 69 cm",
    curatorNote:
      "A comfort piece with true vintage spirit and no trend dependence.",
    storeSlug: "north-archive",
    isFeatured: false,
  },
  {
    slug: "barbour-wax-jacket",
    title: "Wax Jacket",
    brand: "Barbour",
    category: "Outerwear",
    size: "M",
    condition: "Good",
    price: 9300,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Dark green waxed cotton field jacket",
    description:
      "Classic countryside wax jacket with lived-in finish and practical pocket layout.",
    material: "Waxed cotton",
    color: "Moss",
    era: "1990s",
    fit: "Regular",
    measurements: "Shoulders 48 cm, chest 60 cm, length 76 cm",
    curatorNote:
      "Properly broken-in wax cotton has a depth modern copies never reach.",
    storeSlug: "rack-no-7",
    isFeatured: false,
  },
  {
    slug: "lacoste-knit-polo",
    title: "Knit Polo",
    brand: "Lacoste",
    category: "Knitwear",
    size: "M",
    condition: "Excellent",
    price: 3400,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Cream vintage knit polo shirt",
    description:
      "Fine-gauge knit polo with a gentle collar roll and clean summer texture.",
    material: "Cotton knit",
    color: "Ivory",
    era: "1980s",
    fit: "Regular",
    measurements: "Shoulders 44 cm, chest 53 cm, length 66 cm",
    curatorNote:
      "Preppy, minimal and unexpectedly versatile with tailored trousers.",
    storeSlug: "slow-finds",
    isFeatured: false,
  },
  {
    slug: "prada-nylon-shoulder-bag",
    title: "Nylon Shoulder Bag",
    brand: "Prada",
    category: "Accessories",
    size: "One size",
    condition: "Very good",
    price: 14900,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Black Prada nylon shoulder bag",
    description:
      "Compact archival nylon bag with minimalist profile and iconic utility charm.",
    material: "Nylon",
    color: "Black",
    era: "Early 2000s",
    fit: "Shoulder carry",
    measurements: "Width 24 cm, height 16 cm, depth 7 cm",
    curatorNote:
      "A quiet grail: practical, recognizable, and still deeply modern.",
    storeSlug: "sunday-archive",
    isFeatured: true,
    status: ItemStatus.RESERVED,
  },
  {
    slug: "north-face-nuptse-vest",
    title: "Nuptse Vest",
    brand: "The North Face",
    category: "Outerwear",
    size: "L",
    condition: "Excellent",
    price: 7600,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Black puffer vest layered over knit",
    description:
      "Lightweight insulated vest with iconic volume, ideal for transitional weather layering.",
    material: "Ripstop nylon",
    color: "Black",
    era: "2010s",
    fit: "Regular",
    measurements: "Shoulders 45 cm, chest 59 cm, length 70 cm",
    curatorNote:
      "A practical layer that gives structure to soft, minimal outfits.",
    storeSlug: "north-archive",
    isFeatured: false,
  },
  {
    slug: "our-legacy-cropped-trousers",
    title: "Cropped Trousers",
    brand: "Our Legacy",
    category: "Tailoring",
    size: "W31",
    condition: "Excellent",
    price: 7200,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Charcoal cropped tailored trousers",
    description:
      "Structured tailored trousers with slightly cropped length and modern drape.",
    material: "Virgin wool blend",
    color: "Graphite",
    era: "2010s",
    fit: "Tapered",
    measurements: "Waist 80 cm, rise 31 cm, inseam 70 cm",
    curatorNote:
      "One pair that works with loafers, boots, sneakers and everything in between.",
    storeSlug: "slow-finds",
    isFeatured: true,
  },
  {
    slug: "jw-anderson-striped-knit",
    title: "Striped Knit",
    brand: "JW Anderson",
    category: "Knitwear",
    size: "M",
    condition: "Very good",
    price: 8100,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Soft striped wool sweater",
    description:
      "Playful stripe rhythm on a refined knit base with tactile wool finish.",
    material: "Wool",
    color: "Cream / Brown",
    era: "2010s",
    fit: "Relaxed",
    measurements: "Shoulders 49 cm, chest 57 cm, length 68 cm",
    curatorNote:
      "The rare statement knit that still feels calm in a minimalist wardrobe.",
    storeSlug: "sunday-archive",
    isFeatured: false,
  },
  {
    slug: "vintage-suede-loafers",
    title: "Suede Loafers",
    brand: "Church's",
    category: "Footwear",
    size: "EU 42",
    condition: "Good",
    price: 6600,
    currency: "₽",
    imageUrl:
      "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Brown suede loafers",
    description:
      "Soft suede loafers with elegant almond shape and comfortable broken-in sole.",
    material: "Suede",
    color: "Tobacco",
    era: "1990s",
    fit: "True to size",
    measurements: "Insole 27.5 cm",
    curatorNote:
      "This is that old-money shoe energy, but with real vintage personality.",
    storeSlug: "rack-no-7",
    isFeatured: false,
    status: ItemStatus.SOLD,
  },
];

const getItemData = (item: ItemSeed): Omit<ItemSeed, "storeSlug"> =>
  Object.fromEntries(
    Object.entries(item).filter(([key]) => key !== "storeSlug"),
  ) as Omit<ItemSeed, "storeSlug">;

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.item.deleteMany();
  await prisma.store.deleteMany();

  const createdStores = new Map<string, string>();

  for (const store of stores) {
    const createdStore = await prisma.store.create({ data: store });
    createdStores.set(store.slug, createdStore.id);
  }

  for (const item of items) {
    const storeId = createdStores.get(item.storeSlug);

    if (!storeId) {
      throw new Error(`Store with slug ${item.storeSlug} was not created.`);
    }

    const itemData = getItemData(item);

    await prisma.item.create({
      data: {
        ...itemData,
        status: itemData.status ?? ItemStatus.AVAILABLE,
        storeId,
      },
    });
  }

  console.log(`Seeded ${stores.length} stores and ${items.length} items.`);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
