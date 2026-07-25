import { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiSend, FiMessageCircle } from 'react-icons/fi';
import './Contact.css';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = `*Nouveau message depuis NexadigicPro*%0A%0A*Nom:* ${form.name}%0A*Email:* ${form.email}%0A*Sujet:* ${form.subject}%0A%0A*Message:*%0A${form.message}`;
    window.open(`https://wa.me/237672342582?text=${text}`, '_blank');
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="container">
          <h1>Contactez-nous</h1>
          <p>Une question, une suggestion ou besoin d'aide ? Notre equipe est la pour vous accompagner.</p>
        </div>
      </section>

      <section className="contact-content">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Nos coordonnees</h2>
              <p className="contact-info-subtitle">N'hesitez pas a nous contacter par le canal de votre choix.</p>

              <div className="contact-info-list">
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <FiPhone />
                  </div>
                  <div>
                    <h4>Telephone</h4>
                    <p>+237 672 342 582</p>
                    <p>+237 656 180 051</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <FiMail />
                  </div>
                  <div>
                    <h4>Email</h4>
                    <p>contactnexa6@gmail.com</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <FiMapPin />
                  </div>
                  <div>
                    <h4>Adresse</h4>
                    <p>Yaounde, Cameroun</p>
                  </div>
                </div>
                <div className="contact-info-item">
                  <div className="contact-info-icon whatsapp">
                    <FiMessageCircle />
                  </div>
                  <div>
                    <h4>WhatsApp</h4>
                    <a href="https://wa.me/237672342582" target="_blank" rel="noopener noreferrer">Discuter sur WhatsApp</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-card">
              <h2>Envoyez-nous un message</h2>
              <p className="contact-form-subtitle">Votre message sera envoye directement sur notre WhatsApp.</p>

              {sent && (
                <div className="contact-success">Message envoye avec succes !</div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom complet *</label>
                    <input className="form-control" placeholder="Votre nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" className="form-control" placeholder="votre@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Sujet *</label>
                  <input className="form-control" placeholder="De quoi s'agit-il ?" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Message *</label>
                  <textarea className="form-control" rows={5} placeholder="Ecrivez votre message ici..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  <FiSend /> Envoyer le message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
