import ProductList from '@/app/components/ProductList';

export default function CategoryPage({ params }: { params: { handle: string } }) {
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Products in Category</h1>
      <ProductList handle={params.handle} />
    </div>
  );
}