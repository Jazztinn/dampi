import React, { useRef } from 'react';
import { Heart, Activity, Shield, Pill } from 'lucide-react';
import './HealthOverviewCarousel.css';

const HealthOverviewCarousel = () => {
  const scrollContainerRef = useRef(null);

  const metrics = [
    {
      id: 'symptoms',
      Icon: Heart,
      label: 'Symptom Log',
      stat: '3 this week',
      bgColor: '#a4c08a',
    },
    {
      id: 'growth',
      Icon: Activity,
      label: 'Growth Track',
      stat: '32.5 kg',
      bgColor: '#b8d4d0',
    },
    {
      id: 'vaccines',
      Icon: Shield,
      label: 'Vaccines',
      stat: '2 upcoming',
      bgColor: '#d4b9a0',
    },
    {
      id: 'medications',
      Icon: Pill,
      label: 'Medications',
      stat: '1 active',
      bgColor: '#d9b5a8',
    },
  ];

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
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

      {/* Carousel Container */}
      <div className="health-overview__carousel" ref={scrollContainerRef}>
        {metrics.map((metric) => (
          <div key={metric.id} className="health-overview__card" style={{ backgroundColor: metric.bgColor }}>
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
