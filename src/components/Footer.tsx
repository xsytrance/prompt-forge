import { Link } from 'react-router';
import { Github, Twitter, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-moss-900 text-stone-100">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-playfair text-lg font-bold text-cream mb-3">
              🌿 Prompt Forge
            </h3>
            <p className="text-sm text-stone-400 leading-relaxed">
              A digital garden of AI ideas.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="#"
                className="text-stone-400 hover:text-cream transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="text-stone-400 hover:text-cream transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github size={18} />
              </a>
              <a
                href="#"
                className="text-stone-400 hover:text-cream transition-colors duration-200"
                aria-label="Discord"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-inter text-sm font-semibold text-cream mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5">
              {['Bounties', 'Prompt Lab', 'Community', 'Leaderboard'].map(
                (item) => (
                  <li key={item}>
                    <Link
                      to={item === 'Bounties' ? '/' : `/${item.toLowerCase().replace(' ', '-')}`}
                      className="text-sm text-stone-400 hover:text-cream transition-colors duration-200"
                    >
                      {item}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h4 className="font-inter text-sm font-semibold text-cream mb-4">
              Learn
            </h4>
            <ul className="space-y-2.5">
              {[
                'How It Works',
                'Prompt Engineering 101',
                'Word Effects Guide',
                'FAQ',
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-stone-400 hover:text-cream transition-colors duration-200"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin */}
          <div className="flex flex-col justify-end">
            <Link
              to="/admin"
              className="text-xs text-moss-400/60 hover:text-cream transition-colors duration-200 inline-flex items-center gap-1 self-start"
            >
              🔒 Admin
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-moss-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-stone-500">
            © 2026 Prompt Forge
          </p>
          <p className="text-xs text-stone-500">
            Made with 🌱 and AI
          </p>
        </div>
      </div>
    </footer>
  );
}
