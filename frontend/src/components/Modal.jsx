import { useEffect } from 'react';
import { X, Link2, Phone } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import ContactForm from './ContactForm';

/* ── About ── */
const About = () => (
  <div className="space-y-4">
    <p className="text-sm text-gray-300 leading-relaxed">
      GoTube is a modern video streaming and downloading platform built for fast searching,
      watching, and downloading videos in multiple qualities with a clean user experience.
    </p>
    <div className="pt-2 border-t border-[#272727]">
      <p className="text-xs text-gray-500">Created by</p>
      <p className="text-sm font-semibold text-gray-100 mt-0.5">Valdiosolution</p>
    </div>
  </div>
);

/* ── FAQs ── */
const FAQS_DATA = [
  { q: 'How does GoTube work?',         a: 'GoTube uses YouTube search integration and video processing tools to allow users to search, watch, and download videos in multiple formats.' },
  { q: 'Can I download MP3 and MP4?',   a: 'Yes — MP3, 360p, 480p, 720p, 1080p and 4K MP4 formats are supported.' },
  { q: 'Does GoTube support dark mode?', a: 'GoTube uses a premium dark interface by default.' },
  { q: 'Is the website mobile responsive?', a: 'Yes, GoTube is fully optimized for mobile and desktop devices.' },
];

const Faqs = () => (
  <div className="space-y-4">
    {FAQS_DATA.map(({ q, a }, i) => (
      <div key={i} className="space-y-1">
        <p className="text-sm font-semibold text-gray-100">{q}</p>
        <p className="text-sm text-gray-400 leading-relaxed">{a}</p>
        {i < FAQS_DATA.length - 1 && <div className="pt-3 border-b border-[#272727]" />}
      </div>
    ))}
  </div>
);

/* ── Contact ── */
const Contact = () => (
  <div className="space-y-5">
    <div className="space-y-2">
      <a href="https://instagram.com/crack_dev" target="_blank" rel="noopener noreferrer"
         className="flex items-center gap-3 p-3 rounded-xl border border-[#272727]
                    hover:border-[#3e3e3e] hover:bg-[#1a1a1a] transition-colors group">
        <div className="w-9 h-9 rounded-full bg-[#272727] flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Instagram</p>
          <p className="text-sm font-medium text-gray-200 group-hover:text-red-500 transition-colors">@crack_dev</p>
        </div>
      </a>

      <a href="https://wa.me/0795496570" target="_blank" rel="noopener noreferrer"
         className="flex items-center gap-3 p-3 rounded-xl border border-[#272727]
                    hover:border-[#3e3e3e] hover:bg-[#1a1a1a] transition-colors group">
        <div className="w-9 h-9 rounded-full bg-[#272727] flex items-center justify-center shrink-0">
          <Phone className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <p className="text-xs text-gray-500">WhatsApp</p>
          <p className="text-sm font-medium text-gray-200 group-hover:text-red-500 transition-colors">0795496570</p>
        </div>
      </a>
    </div>

    <div className="flex items-center gap-3">
      <div className="flex-1 border-t border-[#272727]" />
      <span className="text-xs text-gray-500 shrink-0">or send a message</span>
      <div className="flex-1 border-t border-[#272727]" />
    </div>

    <ContactForm />
  </div>
);

/* ── Modal map ── */
const MODALS = {
  about:   { title: 'About GoTube', Component: About   },
  faqs:    { title: 'FAQs',         Component: Faqs    },
  contact: { title: 'Contact Us',   Component: Contact },
};

/* ── Modal shell ── */
const Modal = () => {
  const { modal, close } = useModal();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  if (!modal || !MODALS[modal]) return null;
  const { title, Component } = MODALS[modal];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
         role="dialog" aria-modal="true" aria-label={title}>

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-[#161616] rounded-2xl shadow-2xl
                      border border-[#272727] animate-modal"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#272727]">
          <h2 className="text-base font-bold text-gray-100">{title}</h2>
          <button onClick={close}
                  className="w-8 h-8 flex items-center justify-center rounded-full
                             hover:bg-[#272727] transition-colors"
                  aria-label="Close">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[75vh] overflow-y-auto">
          <Component />
        </div>
      </div>
    </div>
  );
};

export default Modal;
