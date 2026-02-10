import { Instagram, Youtube, Twitch, Monitor } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo6.png"
              alt="ChimuCheck Logo"
              width={50}
              height={50}
              className="object-contain"
            />
            <span className="text-2xl font-bold tracking-tighter">
              <span className="text-primary">Chimu</span>
              <span className="text-secondary">Check</span>
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            © {new Date().getFullYear()} Todos los derechos reservados.
          </p>
        </div>

        <div className="flex space-x-6">
          <a href="https://www.instagram.com/chimucheck/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
            <Instagram size={24} />
          </a>
          <a href="https://www.twitch.tv/ChimuCheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-500 transition-colors">
            <Twitch size={24} />
          </a>
          <a href="https://www.youtube.com/ChimuCheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">
            <Youtube size={24} />
          </a>
          <a href="https://www.kick.com/ChimuCheck" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors">
            <Monitor size={24} />
          </a>
        </div>
      </div>
    </footer>
  );
}
