export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="font-display text-2xl font-semibold">
            ShopCity <span className="text-gold">LK</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Sri Lanka's online city center. Compare prices across verified local shops and buy with
            confidence.
          </p>
        </div>
        <FooterCol title="Shop" links={["All shops", "Categories", "Cheapest deals", "Top rated"]} />
        <FooterCol title="Sellers" links={["Become a seller", "Verification", "Seller handbook", "Pricing"]} />
        <FooterCol title="Trust" links={["How verification works", "Report a seller", "Buyer protection", "Contact"]} />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} ShopCity LK · Made in Sri Lanka</span>
          <span>All prices in Sri Lankan Rupees (LKR)</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l} className="cursor-pointer hover:text-foreground">
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}
