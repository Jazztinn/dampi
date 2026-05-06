import React, { useRef, useEffect } from 'react';
import { Heart, Activity, Shield, Pill } from 'lucide-react';
import './HealthOverviewCarousel.css';

const CARD_WIDTH = 192;
const CARD_GAP = 16;
const ITEM_WIDTH = CARD_WIDTH + CARD_GAP;

const HealthOverviewCarousel = () => {
  const scrollContainerRef = useRef(null);
  const isTeleporting = useRef(false);

  const metrics = [
    {
      id: 'symptoms',
      Icon: Heart,
      label: 'Symptom Log',
      stat: '3 this week',
      bgColor: 'rgba(164, 192, 138, 0.35)',
    },
    {
      id: 'growth',
      Icon: Activity,
      label: 'Growth Track',
      stat: '32.5 kg',
      bgColor: 'rgba(184, 212, 208, 0.35)',
    },
    {
      id: 'vaccines',
      Icon: Shield,
      label: 'Vaccines',
      stat: '2 upcoming',
      bgColor: 'rgba(212, 185, 160, 0.35)',
    },
    {
      id: 'medications',
      Icon: Pill,
      label: 'Medications',
      stat: '1 active',
      bgColor: 'rgba(217, 181, 168, 0.35)',
    },
  ];

  // Triple the list: [clones] [real] [clones]
  const extendedMetrics = [...metrics, ...metrics, ...metrics];
  const sectionWidth = metrics.length * ITEM_WIDTH;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Start at the beginning of the middle (real) section
    container.scrollLeft = sectionWidth;

    const handleScroll = () => {
      if (isTeleporting.current) return;
      const { scrollLeft } = container;

      if (scrollLeft <= 0) {
        isTeleporting.current = true;
        container.scrollLeft = sectionWidth;
        requestAnimationFrame(() => { isTeleporting.current = false; });
      } else if (scrollLeft >= sectionWidth * 2) {
        isTeleporting.current = true;
        container.scrollLeft = scrollLeft - sectionWidth;
        requestAnimationFrame(() => { isTeleporting.current = false; });
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [sectionWidth]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -ITEM_WIDTH : ITEM_WIDTH,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="health-overview">
      <div className="health-overview__header">
        <h2 className="health-overview__title">Health Overview</h2>
        <div className="health-overview__nav">
          <button
            onClick={() => scroll('left')}
            className="health-overview__nav-btn"
            aria-label="Scroll left"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className="health-overview__nav-btn"
            aria-label="Scroll right"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="health-overview__carousel" ref={scrollContainerRef}>
        {extendedMetrics.map((metric, index) => (
          <div key={`${metric.id}-${index}`} className="health-overview__card" style={{ backgroundColor: metric.bgColor }}>
            <div className="health-overview__card-header">
              <div className="health-overview__card-icon-bg">
                <metric.Icon size={18} strokeWidth={2} />
              </div>
              <h3 className="health-overview__card-label">{metric.label}</h3>
            </div>
            <div className="health-overview__card-content">
              <div className="health-overview__card-stat">{metric.stat}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HealthOverviewCarousel;
