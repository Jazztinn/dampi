import React, { useRef, useEffect } from 'react';
import { Heart, Activity, Shield, Pill } from 'lucide-react';
import './DashboardMetricsCarousel.css';

const CARD_WIDTH = 150;
const CARD_GAP = 16;
const CARD_STEP = CARD_WIDTH + CARD_GAP;

const DashboardMetricsCarousel = () => {
  const scrollContainerRef = useRef(null);
  const cardRefs = useRef([]);

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
    container.addEventListener('scroll', updateCards, { passive: true });
    window.addEventListener('resize', updateCards);
    setTimeout(updateCards, 50);
    return () => {
      container.removeEventListener('scroll', updateCards);
      window.removeEventListener('resize', updateCards);
    };
  }, []);

  const metrics = [
    {
      id: 'symptoms',
      Icon: Heart,
      label: 'Symptom Log',
      value: '0',
      unit: 'Logs',
      color: '#8cb369',
    },
    {
      id: 'growth',
      Icon: Activity,
      label: 'Growth Track',
      value: '--',
      unit: 'Not tracked',
      color: '#ff7345',
    },
    {
      id: 'vaccines',
      Icon: Shield,
      label: 'Vaccines',
      value: '--',
      unit: 'Not tracked',
      color: '#9074ff',
    },
    {
      id: 'medications',
      Icon: Pill,
      label: 'Medications',
      value: '--',
      unit: 'Not tracked',
      color: '#589aff',
    },
  ];

  return (
    <div className="dmc-wrapper">
      <div className="dmc-fade dmc-fade--left" />
      <div className="dmc-fade dmc-fade--right" />

      <div
        ref={scrollContainerRef}
        className="dmc-scroll"
      >
        {metrics.map((metric, i) => (
          <div key={metric.id} className="dmc-snap-item">
            <div
              ref={(el) => (cardRefs.current[i] = el)}
              className="dmc-card-inner"
            >
              <div className="dmc-card" style={{ backgroundColor: metric.color }}>
                <div className="dmc-card__header">
                  <metric.Icon size={16} strokeWidth={2.5} />
                  {metric.label}
                </div>
                <div className="dmc-card__body">
                  <span className="dmc-card__value">{metric.value}</span>
                  <span className="dmc-card__unit">{metric.unit}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardMetricsCarousel;
