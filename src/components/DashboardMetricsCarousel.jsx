import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Plus, Camera, Activity, Ruler, Pill, Calendar } from 'lucide-react';
import { getSupabaseBrowserClient } from '../lib/supabase.js';
import './DashboardMetricsCarousel.css';

const CARD_WIDTH = 200;
const CARD_GAP = -24;
const CARD_STEP = CARD_WIDTH + CARD_GAP;

const WIDGET_DEFS = {
  vitals: { title: 'Last Vitals', Icon: Activity, color: '#4D736C' },
  growth: { title: 'Growth', Icon: Ruler, color: '#EDA16D' },
  meds: { title: 'Medications', Icon: Pill, color: '#4D736C' },
  appointments: { title: 'Upcoming', Icon: Calendar, color: '#EDA16D' },
};

const DashboardMetricsCarousel = ({ 
  profile, 
  child, 
  children = [], 
  onChildrenChange,
  activeWidgetIds = ['vitals', 'growth'],
  recentLogs = []
}) => {
  const scrollContainerRef = useRef(null);
  const cardRefs = useRef([]);
  const isTeleporting = useRef(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const activeChild = child || children[0];

  const handlePhotoClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChild?.id || !profile?.id) return;

    setUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split('.').pop();
      const path = `${profile.id}/child-${activeChild.id}-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(path);

      const avatarUrl = `${publicUrl}?v=${Date.now()}`;
      const { data: updatedChild, error: updateError } = await supabase
        .from('children')
        .update({ avatar_url: avatarUrl })
        .eq('id', activeChild.id)
        .select()
        .single();

      if (updateError) throw updateError;

      onChildrenChange?.((prev) => 
        prev.map(c => c.id === updatedChild.id ? updatedChild : c)
      );
    } catch (err) {
      console.error('Photo upload error:', err);
      alert(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const metrics = useMemo(() => {
    const list = [
      { 
        id: 'photo', 
        title: activeChild?.full_name || 'Add Child', 
        Icon: Camera, 
        type: 'photo',
        photoUrl: activeChild?.avatar_url 
      }
    ];

    activeWidgetIds.forEach(id => {
      const def = WIDGET_DEFS[id];
      if (!def) return;

      let value = 'No data';
      let subtitle = 'Not recorded yet';

      if (id === 'vitals' && recentLogs.length > 0) {
        const lastLogWithVitals = recentLogs.find(l => l.summary?.vitalSigns?.temperature);
        if (lastLogWithVitals) {
          const vs = lastLogWithVitals.summary.vitalSigns;
          value = `${vs.temperature || '—'}°C / ${vs.oxygenSat || '—'}%`;
          subtitle = `Recorded ${new Date(lastLogWithVitals.started_at).toLocaleDateString()}`;
        }
      }

      list.push({ id, ...def, value, subtitle, type: 'metric' });
    });

    return list;
  }, [activeChild, activeWidgetIds, recentLogs]);

  const extendedMetrics = [...metrics, ...metrics, ...metrics];
  const sectionWidth = metrics.length * CARD_STEP;

  const updateCards = () => {
    if (!scrollContainerRef.current) return;
    const scrollLeft = scrollContainerRef.current.scrollLeft;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const distance = index * CARD_STEP - scrollLeft;
      const normalized = distance / CARD_STEP;
      const clamped = Math.max(-2.5, Math.min(2.5, normalized));

      const rotateY = clamped * 45;
      const translateZ = -Math.abs(clamped) * 75;
      const scale = 1 - Math.abs(clamped) * 0.08;
      const opacity = Math.max(0.25, 1 - Math.abs(clamped) * 0.6);

      card.style.transform = `perspective(800px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
      card.style.opacity = opacity;
      card.style.zIndex = Math.round(100 - Math.abs(clamped) * 10);
    });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollLeft = sectionWidth;

    let animationFrameId;
    const handleScroll = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        updateCards();
        if (isTeleporting.current) return;
        const currentScroll = container.scrollLeft;
        if (currentScroll <= CARD_STEP) {
          isTeleporting.current = true;
          container.scrollLeft = currentScroll + sectionWidth;
          requestAnimationFrame(() => { isTeleporting.current = false; });
        } else if (currentScroll >= sectionWidth * 2) {
          isTeleporting.current = true;
          container.scrollLeft = currentScroll - sectionWidth;
          requestAnimationFrame(() => { isTeleporting.current = false; });
        }
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateCards);
    setTimeout(updateCards, 50);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateCards);
    };
  }, [sectionWidth, metrics.length]);

  return (
    <div className="dmc-wrapper">
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
      <div className="dmc-fade dmc-fade--left" />
      <div className="dmc-fade dmc-fade--right" />

      <div ref={scrollContainerRef} className="dmc-scroll">
        {extendedMetrics.map((metric, i) => (
          <div key={`${metric.id}-${i}`} className="dmc-snap-item">
            <div ref={(el) => (cardRefs.current[i] = el)} className="dmc-card-inner">
              <div className="dmc-card">
                {metric.type === 'photo' ? (
                  <div className="dmc-card__photo-container" onClick={handlePhotoClick}>
                    {metric.photoUrl ? (
                      <img src={metric.photoUrl} alt="" className="dmc-card__photo" />
                    ) : (
                      <div className="dmc-card__photo-placeholder">
                        {uploading ? <div className="dmc-spinner" /> : <Camera size={32} />}
                      </div>
                    )}
                    <div className="dmc-card__photo-overlay">
                      <p className="dmc-card__photo-name">{metric.title}</p>
                      <button className="dmc-card__photo-edit" aria-label="Edit photo">
                        {uploading ? '...' : <Plus size={14} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dmc-card__content">
                    <div className="dmc-card__header">
                      <div className="dmc-card__icon-wrap" style={{ backgroundColor: metric.color + '20', color: metric.color }}>
                        <metric.Icon size={20} strokeWidth={2.2} />
                      </div>
                      <button className="dmc-card__add-btn" aria-label="Add log">
                        <Plus size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                    <div className="dmc-card__body">
                      <h4 className="dmc-card__title">{metric.title}</h4>
                      <p className="dmc-card__subtitle">{metric.subtitle}</p>
                      <div className="dmc-card__spacer" />
                      <p className="dmc-card__value" style={{ color: metric.color }}>{metric.value}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardMetricsCarousel;
