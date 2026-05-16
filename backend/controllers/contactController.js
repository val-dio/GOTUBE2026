const transporter = require('../utils/mailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contact = async (req, res) => {
  const { name, email, message } = req.body;

  // Validation
  if (!name?.trim())         return res.status(400).json({ error: 'Name is required.' });
  if (!email?.trim())        return res.status(400).json({ error: 'Email is required.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email address.' });
  if (!message?.trim())      return res.status(400).json({ error: 'Message is required.' });
  if (message.trim().length < 10)
    return res.status(400).json({ error: 'Message must be at least 10 characters.' });

  const mailOptions = {
    from:    `"GoTube Contact" <${process.env.EMAIL_USER}>`,
    to:      process.env.EMAIL_TO || 'dioval398@gmail.com',
    subject: 'New GoTube Contact Message',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#dc2626;margin:0 0 20px">New GoTube Contact Message</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;width:90px;">Name</td>
            <td style="padding:8px 0;font-weight:600;color:#111827;">${name.trim()}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">Email</td>
            <td style="padding:8px 0;font-weight:600;color:#111827;">
              <a href="mailto:${email.trim()}" style="color:#dc2626;">${email.trim()}</a>
            </td>
          </tr>
        </table>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
        <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">Message</p>
        <p style="color:#111827;line-height:1.6;white-space:pre-wrap;">${message.trim()}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0 12px;" />
        <p style="color:#9ca3af;font-size:11px;margin:0;">Sent via GoTube · Valdiosolution</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (err) {
    console.error('[mailer]', err.message);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
};

module.exports = { contact };
