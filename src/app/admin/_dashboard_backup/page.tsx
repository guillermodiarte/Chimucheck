import { getContent, updateHero, addNews, deleteNews } from "@/app/actions/content";
import { logout } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const data = await getContent();

  async function handleUpdateHero(formData: FormData) {
    "use server";
    const heroData = {
      title: formData.get("title"),
      subtitle: formData.get("subtitle"),
      description: formData.get("description"),
      imageUrl: formData.get("imageUrl"),
    };
    await updateHero(heroData);
  }

  async function handleAddNews(formData: FormData) {
    "use server";
    const newsItem = {
      id: Date.now().toString(),
      title: formData.get("title"),
      content: formData.get("content"),
      image: formData.get("image"),
      date: new Date().toISOString().split('T')[0],
    };
    await addNews(newsItem);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <form action={logout}>
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors">
              Cerrar Sesión
            </button>
          </form>
        </div>

        {/* Hero Editor */}
        <section className="bg-gray-800 p-6 rounded-lg mb-10 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-primary">Editar Banner Principal</h2>
          <form action={handleUpdateHero} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input name="title" defaultValue={data.hero.title} required className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subtítulo</label>
                <input name="subtitle" defaultValue={data.hero.subtitle} required className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-primary outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea name="description" defaultValue={data.hero.description} required className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-primary outline-none h-24" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL de Imagen de Fondo</label>
              <input name="imageUrl" defaultValue={data.hero.imageUrl} required className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-primary outline-none" />
            </div>
            <button type="submit" className="bg-secondary text-black font-bold py-2 px-6 rounded hover:bg-cyan-400 transition-colors">
              Guardar Cambios
            </button>
          </form>
        </section>

        {/* Add News */}
        <section className="bg-gray-800 p-6 rounded-lg mb-10 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-primary">Agregar Noticia</h2>
          <form action={handleAddNews} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input name="title" required className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-primary outline-none" placeholder="Nueva Noticia..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL de Imagen</label>
                <input name="image" required className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-primary outline-none" placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contenido</label>
              <textarea name="content" required className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-primary outline-none h-24" placeholder="Escribe aquí..." />
            </div>
            <button type="submit" className="bg-green-600 text-white font-bold py-2 px-6 rounded hover:bg-green-500 transition-colors">
              Publicar Noticia
            </button>
          </form>
        </section>

        {/* Existing News List */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-white">Noticias Publicadas</h2>
          <div className="grid grid-cols-1 gap-4">
            {data.news.map((item: any) => (
              <div key={item.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-start">
                <div className="flex gap-4">
                  <img src={item.image} alt={item.title} className="w-24 h-24 object-cover rounded" />
                  <div>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-gray-400 text-sm mb-1">{item.date}</p>
                    <p className="text-gray-300 text-sm line-clamp-2">{item.content}</p>
                  </div>
                </div>
                <form action={async () => {
                  "use server";
                  await deleteNews(item.id);
                }}>
                  <button type="submit" className="text-red-500 hover:text-red-400 font-medium text-sm">
                    Eliminar
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
