import { ProductsPanel } from "@/features/produtos/products-panel";

export const metadata = {
  title: "Produtos — Atlas Store",
  description:
    "Catálogo e estoque da Atlas Store: roupas, tênis e acessórios com custo real por peça, preço e margem.",
};

export default function ProdutosPage() {
  return <ProductsPanel />;
}
