import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StoreShell } from "@/components/storefront/StoreShell";
import { assets } from "@/lib/assets";
import { ArrowRight, ArrowLeft, BadgeCheck, Clock3, MapPin, ShieldCheck, Sparkles, ThermometerSnowflake, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import HeroSlideshow from "@/components/HeroSlideshow";
import { useCampaign } from "@/contexts/CampaignContext";
import { apiUrl } from "@/lib/api";

const promises = [
  { icon: ThermometerSnowflake, title: "Freshness locked", text: "Temperature-controlled handling from source to doorstep." },
  { icon: ShieldCheck, title: "Cleaned with care", text: "Hygienic cuts prepared by trained specialists." },
  { icon: Clock3, title: "Quick local delivery", text: "Clear delivery windows across serviceable Kolkata areas." },
];

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeCampaign } = useCampaign();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        const categoriesResponse = await fetch(apiUrl('categories'));
        if (!categoriesResponse.ok) throw new Error(`Failed to fetch categories: ${categoriesResponse.status}`);
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Fetch products
        const productsResponse = await fetch(apiUrl('products'));
        if (!productsResponse.ok) throw new Error(`Failed to fetch products: ${productsResponse.status}`);
        let productsData = await productsResponse.json();
        productsData = productsData.data || productsData;
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching home page data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <StoreShell>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      </StoreShell>
    );
  }

  // Shared category configuration for landing page
  const landingCategories = [
    { label: "Chicken", slug: "chicken" },
    { label: "Mutton", slug: "mutton" },
    { label: "Fish", slug: "fish" },
    { label: "Prawns", slug: "prawns" },
    { label: "Crabs & Seafood", slug: "crabs-seafood" },
    { label: "Combos", slug: "combos" },
    { label: "Offers", slug: "offers" },
  ];

  return (
    <StoreShell>
      <section className="container pt-5 sm:pt-7">
        <HeroSlideshow />
      </section>

      {/* Seasonal Collection Module */}
      {activeCampaign && (activeCampaign.placement === 'collection_module' || activeCampaign.placement === 'both') && (
        <section className="container pt-6 sm:pt-10">
          <div
            className="group relative overflow-hidden rounded-[2rem] p-8 sm:p-12"
            style={{ backgroundColor: activeCampaign.backgroundColor }}
          >
            {/* Background Pattern / Image */}
            {(activeCampaign.backgroundPattern || activeCampaign.collectionImageUrl || activeCampaign.desktopImageUrl) && (
              <div
                className="absolute inset-0 opacity-20 transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${activeCampaign.backgroundPattern || activeCampaign.collectionImageUrl || activeCampaign.desktopImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}

            <div className="relative z-10 flex flex-col items-start gap-4 max-w-2xl">
              {activeCampaign.logoVariant && (
                <img src={activeCampaign.logoVariant} alt="" className="h-12 w-auto object-contain mb-2" />
              )}

              <h2
                className="font-display text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: activeCampaign.foregroundColor }}
              >
                {activeCampaign.collectionTitle || activeCampaign.name}
              </h2>

              <p
                className="text-lg font-medium sm:text-xl opacity-90"
                style={{ color: activeCampaign.foregroundColor }}
              >
                {activeCampaign.collectionSubtitle || activeCampaign.message}
              </p>

              {activeCampaign.ctaLabel && (
                <Link
                  href={activeCampaign.collectionLink || activeCampaign.destinationValue || "/shop"}
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95"
                  style={{
                    backgroundColor: activeCampaign.buttonColor,
                    color: activeCampaign.buttonTextColor
                  }}
                >
                  {activeCampaign.ctaLabel}
                  <ArrowRight className="size-4" />
                </Link>
              )}
            </div>

            {/* Decorative accent */}
            {activeCampaign.accentColor && (
              <div
                className="absolute -right-24 -top-24 size-64 rounded-full blur-3xl opacity-30"
                style={{ backgroundColor: activeCampaign.accentColor }}
              />
            )}
          </div>
        </section>
      )}

      {/* Keep the existing sections below the hero */}
      <section className="container pt-5 sm:pt-7">
        <div className="space-y-8">
          <div className="border-b border-black/5 bg-[#F6F1EC]">
            <div className="container py-10 sm:py-14">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B4232C]">Fresh catalogue</p>
              <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="font-display text-4xl font-black tracking-[-0.045em] sm:text-5xl">Shop all fresh cuts</h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    Chicken, mutton, fish, prawns and non-vegetarian combos—nothing else.
                  </p>
                </div>
                <Link href="/" className="text-sm font-bold text-[#B4232C]">
                  Home / <span className="text-muted-foreground">Shop</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="container py-8 sm:py-12">
            <div className="mt-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Featured Products</h2>
                <p className="mt-1 text-xs text-muted-foreground">{products.length} products · prices updated today</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:gap-5 lg:grid-cols-[1fr_auto_auto]">
              {products.length > 0 ? (
                <>
                  {products.slice(0, 8).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                  {products.length > 8 && (
                    <Link href="/shop" className="col-span-2 mt-4 self-end">
                      View all products ({products.length})
                    </Link>
                  )}
                </>
              ) : (
                <div className="col-span-2 py-12 text-center">
                  <p className="text-[0.9rem] text-foreground">
                    No products available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </StoreShell>
  );
}

// Helper function to get category-specific colors
function getCategoryColor(slug: string): string {
  switch (slug) {
    case 'chicken':
      return '#D62F37'; // Red/coral
    case 'mutton':
      return '#B4232C'; // Warm gold
    case 'fish':
      return '#0EA5E9'; // Blue
    case 'prawns':
      return '#10B981'; // Emerald
    case 'crabs-seafood':
      return '#F59E0B'; // Amber
    case 'combos':
      return '#8B5CF6'; // Violet
    case 'offers':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
}