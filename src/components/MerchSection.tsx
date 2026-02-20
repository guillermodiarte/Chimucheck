"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
};

// This would typically come from props or a data file, hardcoded for now based on content.json structure
const products: Product[] = [
  {
    id: "1",
    name: "ChimuGorra Oficial",
    price: "7 ChimuCoins",
    image: "/images/merch/cap-1.jpg"
  },
  {
    id: "2",
    name: "ChimuTaza Gamer",
    price: "7 ChimuCoins",
    image: "/images/merch/mug-1.jpg"
  },
  {
    id: "3",
    name: "ChimuRemera Pro",
    price: "15 ChimuCoins",
    image: "/images/logo.jpg" // Placeholder until user provides tshirt image
  }
];

export default function MerchSection() {
  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30 text-secondary mb-4">
            <ShoppingBag size={16} />
            <span className="text-sm font-bold tracking-wider">TIENDA OFICIAL</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4">
            LOOT <span className="text-secondary">EXCLUSIVO</span>
          </h2>
          <p className="text-xl text-gray-400">Canjea tus ChimuCoins por equipamiento real.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-gray-900 rounded-2xl border border-white/5 hover:border-secondary/50 overflow-hidden transition-all duration-300 hover:-translate-y-2"
            >
              <div className="aspect-square relative overflow-hidden bg-white/5">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur border border-secondary/30 text-secondary font-bold px-3 py-1 rounded-lg">
                  {product.price}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                <button className="w-full py-3 bg-white/5 hover:bg-secondary hover:text-black border border-white/10 hover:border-secondary text-white font-bold rounded-xl transition-all duration-300">
                  CANJEAR AHORA
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
