import {
  ArrowRight,
  Check,
  FilePenLine,
  Heart,
  Lightbulb,
  Search,
  ShieldCheck,
} from 'lucide-react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import './hmo-portal.css';

const STEPS = [
  {
    id: 1,
    Icon: FilePenLine,
    title: 'Fill out the online form',
    body: "Share your child's details and upload the required documents.",
  },
  {
    id: 2,
    Icon: Search,
    title: 'We review your request',
    body: 'Our team checks the information and confirms HMO coverage.',
  },
  {
    id: 3,
    Icon: ShieldCheck,
    title: 'Get approved',
    body: "Once approved, you'll be notified and ready for your visit.",
  },
];

function ApprovalIllustration() {
  return (
    <div className="hmo-approval-art" aria-hidden="true">
      <div className="hmo-approval-art__blob" />
      <div className="hmo-approval-art__sparkle" />
      <div className="hmo-approval-art__heart">
        <Heart size={30} fill="currentColor" strokeWidth={0} />
      </div>
      <div className="hmo-approval-art__plant hmo-approval-art__plant--left">
        <span />
        <span />
        <span />
      </div>
      <div className="hmo-approval-art__plant hmo-approval-art__plant--right">
        <span />
        <span />
        <span />
      </div>
      <div className="hmo-approval-art__clipboard">
        <div className="hmo-approval-art__clip">
          <span />
        </div>
        {[0, 1, 2].map((item) => (
          <div className="hmo-approval-art__row" key={item}>
            <Check size={18} strokeWidth={3} />
            <span />
          </div>
        ))}
      </div>
      <div className="hmo-approval-art__shield">
        <Check size={34} strokeWidth={3.4} />
      </div>
    </div>
  );
}

export default function HMOPortalScreen({ onBack }) {
  return (
    <div className="hmo-portal">
      <TopNavBar variant="inner" title="HMO Approval" onBack={onBack} />

      <main className="hmo-portal__content">
        <section className="hmo-portal__hero" aria-labelledby="hmo-approval-title">
          <div className="hmo-portal__hero-copy">
            <p className="hmo-portal__eyebrow">Online HMO Approval</p>
            <h1 id="hmo-approval-title">We make approvals simple and faster</h1>
            <p className="hmo-portal__intro">
              Submit your child's HMO approval request online at least{' '}
              <strong>2 days before your visit</strong> so we can help you get approved on time.
            </p>
            <button className="hmo-portal__cta" type="button">
              Start Request
              <ArrowRight size={24} strokeWidth={2.5} />
            </button>
          </div>

          <ApprovalIllustration />
        </section>

        <section className="hmo-portal__prep" aria-label="Before you start">
          <div className="hmo-portal__prep-icon">
            <Lightbulb size={32} strokeWidth={2.1} />
          </div>
          <div className="hmo-portal__prep-copy">
            <h2>Before you start</h2>
            <p>
              Prepare your child's valid ID or birth record, HMO card, and doctor's test request
              with diagnosis.
            </p>
          </div>
          <div className="hmo-portal__prep-docs" aria-hidden="true">
            <div className="hmo-portal__id-card">
              <span />
              <i />
              <i />
            </div>
            <div className="hmo-portal__hmo-card">
              <b>HMO</b>
              <strong>+</strong>
              <i />
            </div>
          </div>
        </section>

        <section className="hmo-portal__steps" aria-labelledby="hmo-steps-title">
          <h2 id="hmo-steps-title">How it works</h2>
          <div className="hmo-portal__timeline">
            {STEPS.map(({ id, Icon, title, body }) => (
              <article className="hmo-portal__step" key={id}>
                <div className="hmo-portal__step-marker">
                  <span>{id}</span>
                </div>
                <div className="hmo-portal__step-card">
                  <div className="hmo-portal__step-icon">
                    <Icon size={34} strokeWidth={2.1} />
                  </div>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="hmo-portal__note">
          <div className="hmo-portal__note-shield">
            <ShieldCheck size={22} strokeWidth={2.3} />
          </div>
          <p>
            Submit requests <strong>at least 2 days before your visit</strong>. Plan ahead to avoid
            delays for your child's appointment.
          </p>
          <span className="hmo-portal__note-heart">
            <Heart size={30} fill="currentColor" strokeWidth={0} />
          </span>
        </aside>
      </main>
    </div>
  );
}
