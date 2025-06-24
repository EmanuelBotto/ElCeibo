import Caja from './Ventana/caja';
import Producto from './Ventana/producto';
import ListaPrecios from './Ventana/lista-precios';

export default function HomePage() {
  return (
    <main className="p-4">
      <div className="space-y-8">
        <ListaPrecios />
        <Caja />
        <Producto />
      </div>
    </main>
  );
}
