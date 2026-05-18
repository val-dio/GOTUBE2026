import { useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendContactMessage } from '../services/api';

const EMPTY = { name: '', email: '', message: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-400">{label}</label>
    {children}
    {error && (
      <p className="text-xs text-red-400 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 shrink-0" />{error}
      </p>
    )}
  </div>
);

const inputCls = (err) =>
  `w-full px-3 py-2 text-sm rounded-lg border bg-[#0f0f0f]
   text-gray-100 outline-none transition-colors
   placeholder:text-gray-600
   ${err
     ? 'border-red-500 focus:border-red-400'
     : 'border-[#3e3e3e] focus:border-red-600'
   }`;

const ContactForm = () => {
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});
  const [status,  setStatus]  = useState('idle'); // idle | sending | success | error
  const [apiError, setApiError] = useState('');

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(er => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())          e.name    = 'Name is required.';
    if (!form.email.trim())         e.email   = 'Email is required.';
    else if (!EMAIL_RE.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.message.trim())       e.message = 'Message is required.';
    else if (form.message.trim().length < 10) e.message = 'Message must be at least 10 characters.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setStatus('sending');
    setApiError('');
    try {
      await sendContactMessage(form.name.trim(), form.email.trim(), form.message.trim());
      setStatus('success');
      setForm(EMPTY);
      // reset back to idle after 4s
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to send message. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Message sent successfully!</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">We'll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Name" error={errors.name}>
        <input
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={set('name')}
          disabled={status === 'sending'}
          className={inputCls(errors.name)}
        />
      </Field>

      <Field label="Email" error={errors.email}>
        <input
          type="email"
          placeholder="your@email.com"
          value={form.email}
          onChange={set('email')}
          disabled={status === 'sending'}
          className={inputCls(errors.email)}
        />
      </Field>

      <Field label="Message" error={errors.message}>
        <textarea
          placeholder="Write your message..."
          value={form.message}
          onChange={set('message')}
          disabled={status === 'sending'}
          rows={4}
          className={`${inputCls(errors.message)} resize-none`}
        />
      </Field>

      {status === 'error' && apiError && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg
                        bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 dark:text-red-400">{apiError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg
                   bg-red-600 hover:bg-red-700 active:bg-red-800
                   disabled:opacity-60 disabled:cursor-not-allowed
                   text-white text-sm font-semibold transition-colors"
      >
        {status === 'sending' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
};

export default ContactForm;
