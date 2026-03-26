import { Instagram, Youtube, Twitch, Monitor, Facebook, Twitter, MessageCircle } from "lucide-react";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import Image from "next/image";
import { getSocialConfig } from "@/lib/utils";

export default function Footer({ socialLinks, footerData }: { socialLinks?: any; footerData?: any }) {
  const logoUrl = footerData?.logoUrl || "/images/chimu-logo.png";
  const title = footerData?.title || "ChimuCheck";
  const subtitle = footerData?.subtitle || `© ${new Date().getFullYear()} Todos los derechos reservados.`;

  return (
    <footer className="bg-black border-t border-white/10 py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
        {/* Top Row: Logo & Socials */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-[60px] h-[60px]">
              <Image
                src={logoUrl}
                alt="Footer Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold tracking-tighter text-white">
              {title}
            </span>
          </div>

          <div className="flex space-x-6">
          {(() => {
            const inst = getSocialConfig(socialLinks, "instagram");
            const fb = getSocialConfig(socialLinks, "facebook");
            const tw = getSocialConfig(socialLinks, "twitter");
            const wa = getSocialConfig(socialLinks, "whatsapp");
            const twitch = getSocialConfig(socialLinks, "twitch");
            const yt = getSocialConfig(socialLinks, "youtube");
            const kick = getSocialConfig(socialLinks, "kick");
            const tiktok = getSocialConfig(socialLinks, "tiktok");

            return (
              <>
                {inst.active && (
                  <a href={inst.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                    <Instagram size={24} />
                  </a>
                )}
                {fb.active && (
                  <a href={fb.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors">
                    <Facebook size={24} />
                  </a>
                )}
                {tw.active && (
                  <a href={tw.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors">
                    <Twitter size={24} />
                  </a>
                )}
                {wa.active && (
                  <a href={wa.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors">
                    <MessageCircle size={24} />
                  </a>
                )}
                {twitch.active && (
                  <a href={twitch.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-500 transition-colors">
                    <Twitch size={24} />
                  </a>
                )}
                {yt.active && (
                  <a href={yt.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">
                    <Youtube size={24} />
                  </a>
                )}
                {kick.active && (
                  <a href={kick.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-500 transition-colors">
                    <Monitor size={24} />
                  </a>
                )}
                {tiktok.active && (
                  <a href={tiktok.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <TikTokIcon size={24} />
                  </a>
                )}
              </>
            );
          })()}
          </div>
        </div>

        {/* Bottom Row: Text Info */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 pt-4 border-t border-white/5">
          <div className="text-gray-500 text-sm text-center md:text-left">
            <p>Chimucheck © {new Date().getFullYear()}. Todos los derechos reservados.</p>
            <p>Contacto: <a href="mailto:chimucheck@gmail.com" className="hover:text-primary transition-colors">chimucheck@gmail.com</a></p>
          </div>
          <div className="text-gray-500 text-sm text-center md:text-right">
            <p>Desarrollado por <span className="font-semibold text-white">Guillermo A. Diarte</span></p>
            <p>Email: <a href="mailto:guillermodiarte@gmail.com" className="hover:text-primary transition-colors">guillermodiarte@gmail.com</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
}
