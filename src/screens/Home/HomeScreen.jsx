import wordmark from '../../assets/dampi.svg';
import './home-screen.css';

const placeholderCards = [
  {
    eyebrow: 'Dashboard',
    title: 'Web Placeholder',
    body: 'Use this space for your future landing page, care workflows, onboarding, and admin features.',
  },
  {
    eyebrow: 'Mobile',
    title: 'App Preview',
    body: 'This mock phone screen gives you a visual placeholder for the eventual mobile-first experience.',
  },
  {
    eyebrow: 'AI',
    title: 'Assistant Ready',
    body: 'The floating AI button is already wired up to the local Dampi assistant backend.',
  },
];

const quickSections = [
  'Patient intake',
  'Appointments',
  'Care reminders',
  'Messages',
];

export default function HomeScreen({ onOpenAi }) {
  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__brand">
          <img src={wordmark} alt="Dampi" className="hero__wordmark" />
          <span className="hero__tag">Pedia-care placeholder</span>
        </div>
        <button type="button" className="hero__ai-trigger" onClick={onOpenAi}>
          Open AI
        </button>
      </header>

      <main className="layout">
        <section className="panel panel--content">
          <div className="panel__heading">
            <p className="panel__eyebrow">Current Build</p>
            <h1>Black and white placeholder for web and mobile.</h1>
            <p className="panel__lede">
              Dampi now has a clean local starter app you can run with Vite while you build the real product.
            </p>
          </div>

          <div className="card-grid">
            {placeholderCards.map((card) => (
              <article key={card.title} className="info-card">
                <p className="info-card__eyebrow">{card.eyebrow}</p>
                <h2>{card.title}</h2>
                <p>{card.body}</p>
              </article>
            ))}
          </div>

          <section className="blueprint">
            <div>
              <p className="blueprint__eyebrow">Suggested App Areas</p>
              <h2>Simple framework, room to grow.</h2>
            </div>
            <div className="blueprint__list">
              {quickSections.map((item) => (
                <div key={item} className="blueprint__pill">
                  {item}
                </div>
              ))}
            </div>
          </section>
        </section>

        <section className="panel panel--mobile">
          <div className="phone-frame">
            <div className="phone-frame__top" />
            <div className="phone-screen">
              <div className="phone-screen__header">
                <span>Dampi</span>
                <span>Placeholder</span>
              </div>

              <div className="phone-screen__hero">
                <p className="phone-screen__eyebrow">Mobile View</p>
                <h2>Build your app flow here.</h2>
                <p>
                  Keep this as a reference shell for future onboarding, patient records, reminders, or chat.
                </p>
              </div>

              <div className="phone-stack">
                <div className="phone-card">
                  <span className="phone-card__label">Appointments</span>
                  <strong>No upcoming items yet</strong>
                </div>
                <div className="phone-card">
                  <span className="phone-card__label">AI Assistant</span>
                  <strong>Tap the floating button to chat</strong>
                </div>
                <div className="phone-card">
                  <span className="phone-card__label">Notes</span>
                  <strong>Space reserved for future pediatric care tools</strong>
                </div>
              </div>

              <div className="phone-nav">
                <span>Home</span>
                <span>Care</span>
                <span>AI</span>
                <span>Profile</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
