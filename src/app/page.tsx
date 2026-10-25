import { CartHydrator } from "@/components/cart/cart-hydrator"
import { ComandaPanel } from "@/components/cart/comanda-panel"
import { CategoryNav } from "@/components/menu/category-nav"
import { MenuBoard } from "@/components/menu/menu-board"
import { SiteHeader } from "@/components/menu/site-header"
import { getMenu } from "@/lib/menu/queries"

export default async function MenuPage() {
  const { store, categories } = await getMenu()

  return (
    <>
      <CartHydrator />
      <div className="mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-[minmax(0,720px)_380px] lg:justify-between lg:gap-12">
        <main className="min-w-0">
          <SiteHeader store={store} />
          <CategoryNav categories={categories} />
          <MenuBoard categories={categories} />
          <footer className="border-t py-6 pb-28 text-sm text-muted-foreground lg:pb-8">
            A JM Burguer é uma marca fictícia, criada como projeto de portfólio. Endereço, preços e
            horários são ilustrativos.
          </footer>
        </main>
        <ComandaPanel store={store} />
      </div>
    </>
  )
}
