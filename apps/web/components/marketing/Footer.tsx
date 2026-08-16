import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-sunken)] mt-auto">
      <div className="max-w-5xl mx-auto px-5 py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 sm:col-span-1">
            <span className="font-display text-lg text-[var(--ink-primary)] font-medium">Twilight <span className="text-[var(--accent-ember)]">Chronicles</span></span>
            <p className="mt-2 text-sm text-[var(--ink-tertiary)] leading-relaxed max-w-[200px]">The conversations that come out at dusk.</p>
          </div>
          <div>
            <p className="category-label text-[var(--ink-tertiary)] mb-3">Play</p>
            <ul className="flex flex-col gap-2">
              {[{href:"/create",label:"Start a Game"},{href:"/join",label:"Join a Game"},{href:"/how-it-works",label:"How it works"}].map(l=>(
                <li key={l.href}><Link href={l.href} className="text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="category-label text-[var(--ink-tertiary)] mb-3">For</p>
            <ul className="flex flex-col gap-2">
              {[{href:"/for/best-friends",label:"Best friends"},{href:"/for/couples",label:"Couples"},{href:"/for/long-distance",label:"Long distance"}].map(l=>(
                <li key={l.href}><Link href={l.href} className="text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="category-label text-[var(--ink-tertiary)] mb-3">About</p>
            <ul className="flex flex-col gap-2">
              {[{href:"/about",label:"About"},{href:"/faq",label:"FAQ"},{href:"/privacy",label:"Privacy"},{href:"/terms",label:"Terms"},{href:"/contact",label:"Contact"}].map(l=>(
                <li key={l.href}><Link href={l.href} className="text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--border-subtle)] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs text-[var(--ink-tertiary)]">&copy; {year} Twilight Chronicles. All rights reserved.</p>
          <p className="text-xs text-[var(--ink-tertiary)]">Made with care, for people who care about each other.</p>
        </div>
      </div>
    </footer>
  );
}
