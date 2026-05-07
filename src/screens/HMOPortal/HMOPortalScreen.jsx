import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Edit3,
  FilePenLine,
  FileText,
  Heart,
  Lightbulb,
  Save,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import { getSupabaseBrowserClient } from '../../lib/supabase.js';
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

export default function HMOPortalScreen({ profile, hmoCoverage, onHmoCoverageChange, onBack }) {
  const [editingCoverage, setEditingCoverage] = useState(false);
  const [savingCoverage, setSavingCoverage] = useState(false);
  const [coverageError, setCoverageError] = useState('');
  const [coverageForm, setCoverageForm] = useState({
    has_hmo: hmoCoverage?.has_hmo ? 'yes' : hmoCoverage ? 'no' : '',
    provider_name: hmoCoverage?.provider_name || '',
    benefits_tier: hmoCoverage?.benefits_tier || '',
    benefits_notes: hmoCoverage?.benefits_notes || '',
  });

  useEffect(() => {
    setCoverageForm({
      has_hmo: hmoCoverage?.has_hmo ? 'yes' : hmoCoverage ? 'no' : '',
      provider_name: hmoCoverage?.provider_name || '',
      benefits_tier: hmoCoverage?.benefits_tier || '',
      benefits_notes: hmoCoverage?.benefits_notes || '',
    });
  }, [hmoCoverage]);

  const hasHmo = coverageForm.has_hmo === 'yes';
  const coverageSummary = !hmoCoverage
    ? 'Coverage details not added yet'
    : hmoCoverage.has_hmo
      ? `${hmoCoverage.provider_name || 'HMO provider'}${hmoCoverage.benefits_tier ? ` • ${hmoCoverage.benefits_tier}` : ''}`
      : 'No HMO coverage on file';

  const updateCoverageField = (event) => {
    const { name, value } = event.target;
    const next = { ...coverageForm, [name]: value };

    if (name === 'has_hmo' && value === 'no') {
      next.provider_name = '';
      next.benefits_tier = '';
      next.benefits_notes = '';
    }

    setCoverageForm(next);
    setCoverageError('');
  };

  const cancelCoverageEdit = () => {
    setCoverageForm({
      has_hmo: hmoCoverage?.has_hmo ? 'yes' : hmoCoverage ? 'no' : '',
      provider_name: hmoCoverage?.provider_name || '',
      benefits_tier: hmoCoverage?.benefits_tier || '',
      benefits_notes: hmoCoverage?.benefits_notes || '',
    });
    setCoverageError('');
    setEditingCoverage(false);
  };

  const saveCoverage = async (event) => {
    event.preventDefault();
    if (!profile?.id || savingCoverage) return;

    if (!coverageForm.has_hmo) {
      setCoverageError('Choose whether you have HMO coverage.');
      return;
    }

    if (hasHmo && !coverageForm.provider_name.trim()) {
      setCoverageError('Provider name is required.');
      return;
    }

    if (hasHmo && !coverageForm.benefits_tier.trim()) {
      setCoverageError('Benefits or tier is required.');
      return;
    }

    setSavingCoverage(true);
    setCoverageError('');

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('hmo_coverage')
        .upsert({
          profile_id: profile.id,
          has_hmo: hasHmo,
          provider_name: hasHmo ? coverageForm.provider_name.trim() || null : null,
          benefits_tier: hasHmo ? coverageForm.benefits_tier.trim() || null : null,
          benefits_notes: hasHmo ? coverageForm.benefits_notes.trim() || null : null,
        }, { onConflict: 'profile_id' })
        .select()
        .single();

      if (error) throw error;

      onHmoCoverageChange?.(data);
      setEditingCoverage(false);
    } catch (error) {
      setCoverageError(error.message || 'Unable to save HMO coverage.');
    } finally {
      setSavingCoverage(false);
    }
  };

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
            <button
              className="hmo-portal__cta"
              type="button"
              onClick={() => document.getElementById('hmo-actions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Start Request
              <ArrowRight size={24} strokeWidth={2.5} />
            </button>
          </div>

          <ApprovalIllustration />
        </section>

        <section className="hmo-portal__coverage" aria-labelledby="hmo-coverage-title">
          <div className="hmo-portal__coverage-header">
            <div>
              <p className="hmo-portal__eyebrow">Coverage Profile</p>
              <h2 id="hmo-coverage-title">HMO details</h2>
              <p>{coverageSummary}</p>
            </div>
            {!editingCoverage ? (
              <button type="button" className="hmo-portal__icon-btn" onClick={() => setEditingCoverage(true)} aria-label="Edit HMO details">
                <Edit3 size={17} />
              </button>
            ) : (
              <button type="button" className="hmo-portal__icon-btn" onClick={cancelCoverageEdit} aria-label="Cancel HMO edit">
                <X size={18} />
              </button>
            )}
          </div>

          {editingCoverage ? (
            <form className="hmo-portal__coverage-form" onSubmit={saveCoverage}>
              <label htmlFor="hmo-page-has-coverage">Coverage status</label>
              <select
                id="hmo-page-has-coverage"
                name="has_hmo"
                value={coverageForm.has_hmo}
                onChange={updateCoverageField}
              >
                <option value="">Select one</option>
                <option value="yes">Has HMO coverage</option>
                <option value="no">No HMO coverage</option>
              </select>

              {hasHmo && (
                <>
                  <label htmlFor="hmo-page-provider">Provider name</label>
                  <input
                    id="hmo-page-provider"
                    name="provider_name"
                    type="text"
                    value={coverageForm.provider_name}
                    onChange={updateCoverageField}
                    placeholder="HMO provider"
                  />

                  <label htmlFor="hmo-page-tier">Benefits or tier</label>
                  <input
                    id="hmo-page-tier"
                    name="benefits_tier"
                    type="text"
                    value={coverageForm.benefits_tier}
                    onChange={updateCoverageField}
                    placeholder="Plan tier or benefits"
                  />

                  <label htmlFor="hmo-page-notes">Coverage notes</label>
                  <textarea
                    id="hmo-page-notes"
                    name="benefits_notes"
                    rows={3}
                    value={coverageForm.benefits_notes}
                    onChange={updateCoverageField}
                    placeholder="Specific benefits, approval notes, or exclusions"
                  />
                </>
              )}

              {coverageError && <p className="hmo-portal__error">{coverageError}</p>}

              <button type="submit" className="hmo-portal__save-btn" disabled={savingCoverage}>
                <Save size={16} />
                {savingCoverage ? 'Saving...' : 'Save HMO Details'}
              </button>
            </form>
          ) : (
            <div className="hmo-portal__coverage-details">
              <div>
                <span>Status</span>
                <strong>{hmoCoverage ? (hmoCoverage.has_hmo ? 'Covered' : 'No coverage') : 'Not added'}</strong>
              </div>
              <div>
                <span>Provider</span>
                <strong>{hmoCoverage?.provider_name || 'Not provided'}</strong>
              </div>
              <div>
                <span>Benefits</span>
                <strong>{hmoCoverage?.benefits_tier || 'Not provided'}</strong>
              </div>
              {hmoCoverage?.benefits_notes && (
                <p className="hmo-portal__coverage-notes">{hmoCoverage.benefits_notes}</p>
              )}
            </div>
          )}
        </section>

        <section className="hmo-portal__actions" id="hmo-actions" aria-label="HMO support actions">
          <button type="button" className="hmo-portal__action-card">
            <div className="hmo-portal__action-icon">
              <FilePenLine size={22} />
            </div>
            <div>
              <h3>Approval Request</h3>
              <p>Prepare the details needed before your child's visit.</p>
            </div>
          </button>
          <button type="button" className="hmo-portal__action-card">
            <div className="hmo-portal__action-icon hmo-portal__action-icon--warm">
              <FileText size={22} />
            </div>
            <div>
              <h3>Document Requests</h3>
              <p>Track HMO cards, test requests, birth records, and valid IDs.</p>
            </div>
          </button>
          <button type="button" className="hmo-portal__action-card">
            <div className="hmo-portal__action-icon hmo-portal__action-icon--money">
              <CircleDollarSign size={22} />
            </div>
            <div>
              <h3>Financial Assistance</h3>
              <p>Review support options tied to coverage and care costs.</p>
            </div>
          </button>
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
