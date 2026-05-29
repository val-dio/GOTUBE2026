import { useEffect, memo } from 'react';
import { X, Link2, Phone } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import ContactForm from './ContactForm';

/* ── About ── */
const About = () => (
  <div className="space-y-4">
    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
      GoTube is a modern video streaming and downloading platform built for fast searching,
      watching, and downloading videos in multiple qualities with a clean user experience.
    </p>
    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-400 dark:text-gray-500">Created by</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mt-0.5">Valdiosolution</p>
    </div>
  </div>
);

/* ── FAQs ── */
const FAQS_DATA = [
  { q: 'How does GoTube work?',            a: 'GoTube uses YouTube search integration and video processing tools to allow users to search, watch, and download videos in multiple formats.' },
  { q: 'Can I download MP3 and MP4?',      a: 'Yes — MP3 audio, 360p, 480p, 720p HD and 1080p HD MP4 formats are supported.' },
  { q: 'Does GoTube support dark mode?',   a: 'Yes — GoTube supports both light and dark modes with a toggle in the header.' },
  { q: 'Is the website mobile-friendly?',  a: 'Yes, GoTube is fully optimized for mobile and desktop devices.' },
];

const Faqs = () => (
  <div className="space-y-4">
    {FAQS_DATA.map(({ q, a }, i) => (
      <div key={i} className="space-y-1">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{q}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
        {i < FAQS_DATA.length - 1 && <div className="pt-3 border-b border-gray-200 dark:border-gray-700" />}
      </div>
    ))}
  </div>
);

/* ── Contact ── */
const Contact = () => (
  <div className="space-y-5">
    <div className="space-y-2">
      <a
        href="https://instagram.com/crack_dev"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-xl border
                   border-gray-200 dark:border-gray-700
                   hover:border-gray-300 dark:hover:border-gray-600
                   hover:bg-gray-50 dark:hover:bg-gray-800
                   transition-colors group"
      >
        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Instagram</p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-red-500 transition-colors">
            @crack_dev
          </p>
        </div>
      </a>

      <a
        href="https://wa.me/0795496570"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-xl border
                   border-gray-200 dark:border-gray-700
                   hover:border-gray-300 dark:hover:border-gray-600
                   hover:bg-gray-50 dark:hover:bg-gray-800
                   transition-colors group"
      >
        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
          <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">WhatsApp</p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-red-500 transition-colors">
            0795496570
          </p>
        </div>
      </a>
    </div>

    <div className="flex items-center gap-3">
      <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">or send a message</span>
      <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
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
const Modal = memo(() => {
  const { modal, close } = useModal();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  if (!modal || !MODALS[modal]) return null;
  const { title, Component } = MODALS[modal];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Panel — full light/dark theme support */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl shadow-2xl animate-modal
                   bg-white dark:bg-[#161616]
                   border border-gray-200 dark:border-[#272727]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#272727]">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={close}
            className="w-8 h-8 flex items-center justify-center rounded-full
                       hover:bg-gray-100 dark:hover:bg-[#272727] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 max-h-[75vh] overflow-y-auto">
          <Component />
        </div>
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';
export default Modal;
