import React, { useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import './DashboardMetricsCarousel.css';

const CARD_WIDTH = 200;
const CARD_GAP = 4;
const CARD_STEP = CARD_WIDTH + CARD_GAP;

const DashboardMetricsCarousel = () => {
  const scrollContainerRef = useRef(null);
  const cardRefs = useRef([]);
  const isTeleporting = useRef(false);

  const metrics = [
    { id: 'card-1' },
    { id: 'card-2' },
    { id: 'card-3' },
  ];

  // Tripled array for infinite scroll: [prev] [current] [next]
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

    // Start at the middle set so user can scroll in either direction seamlessly
    container.scrollLeft = sectionWidth;

    let animationFrameId;

    const handleScroll = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        updateCards();

        if (isTeleporting.current) return;
        const currentScroll = container.scrollLeft;

        // Teleport deep inside the left clone to the real section
        if (currentScroll <= CARD_STEP) {
          isTeleporting.current = true;
          container.scrollLeft = currentScroll + sectionWidth;
          requestAnimationFrame(() => {
            isTeleporting.current = false;
          });
        } 
        // Teleport deep inside the right clone back to the real section
        else if (currentScroll >= sectionWidth * 2) {
          isTeleporting.current = true;
          container.scrollLeft = currentScroll - sectionWidth;
          requestAnimationFrame(() => {
            isTeleporting.current = false;
          });
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
  }, [sectionWidth]);

  return (
    <div className="dmc-wrapper">
      <div className="dmc-fade dmc-fade--left" />
      <div className="dmc-fade dmc-fade--right" />

      <div
        ref={scrollContainerRef}
        className="dmc-scroll"
      >
        {extendedMetrics.map((metric, i) => (
          <div key={`${metric.id}-${i}`} className="dmc-snap-item">
            <div
              ref={(el) => (cardRefs.current[i] = el)}
              className="dmc-card-inner"
            >
              <div className="dmc-card">
                <button className="dmc-card__add" aria-label="Add">
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardMetricsCarousel;
