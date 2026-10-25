import type { MenuCategory } from "@/lib/menu/types"

/** Jumps to each section. Stays at the top while the menu scrolls. */
export function CategoryNav({ categories }: { categories: MenuCategory[] }) {
  return (
    <nav
      aria-label="Categorias do cardápio"
      className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 backdrop-blur"
    >
      <ul className="flex gap-6 overflow-x-auto">
        {categories.map((category) => (
          <li key={category.id}>
            <a
              href={`#${category.slug}`}
              className="inline-flex h-12 items-center text-base font-semibold whitespace-nowrap underline-offset-8 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {category.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
