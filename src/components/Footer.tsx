import { Instagram, Youtube, Twitch, Monitor, Facebook, Twitter, MessageCircle } from "lucide-react";
import Image from "next/image";
import { getSocialConfig } from "@/lib/utils";

export default function Footer({ socialLinks, footerData }: { socialLinks?: any; footerData?: any }) {
  const logoUrl = footerData?.logoUrl || "/images/chimu-logo.png";
  const title = footerData?.title || "ChimuCheck";
  const subtitle = footerData?.subtitle || `© ${new Date().getFullYear()} Todos los derechos reservados.`;

  return (
    <footer className="bg-black border-t border-white/10 py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
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
          <p className="text-gray-500 text-sm mt-1 whitespace-pre-wrap">
            {subtitle}
          </p>
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
              </>
            );
          })()}
        </div>
      </div>
    </footer>
  );
}
