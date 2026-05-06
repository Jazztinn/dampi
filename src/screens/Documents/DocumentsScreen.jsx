import React, { useEffect, useRef } from 'react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import './documents.css';

const cardData = [
  { id: 1, label: "Buy or rent", color: "#facc15" },
  { id: 2, label: "Weekends", color: "#22c55e" },
  { id: 3, label: "Groceries", color: "#38bdf8" },
  { id: 4, label: "Market tips", color: "#f87171" },
  { id: 5, label: "Sharing", color: "#f472b6", number: "10", hasSpheres: true },
  { id: 6, label: "Retail", color: "#fbbf24" },
  { id: 7, label: "Dining", color: "#4ade80" }
];

export default function DocumentsScreen({ onBack }) {
  const cardsRef = useRef([]);

  useEffect(() => {
    // The main scroll container is `.content-area` from AppNavigator.jsx
    const scrollContainer = document.querySelector('.content-area');
    if (!scrollContainer) return;

    const updateCards = () => {
      const scrollY = scrollContainer.scrollTop;
      const height = scrollContainer.clientHeight;
      const maxScroll = scrollContainer.scrollHeight - height;
      
      // If content isn't tall enough yet, don't break
      if (maxScroll <= 0) return;

      const scrollProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      const totalCards = cardData.length;
      
      // Reverse focal flow: active card goes backwards as we scroll down
      const activeCardFloat = (totalCards - 1) - (scrollProgress * (totalCards - 1));

      cardsRef.current.forEach((cardEl, i) => {
        if (!cardEl) return;
        
        const offset = i - activeCardFloat;
        let translateY = 0;
        let translateZ = 0;
        let rotateX = 0;
        let opacity = 1;

        if (offset <= 0) {
            // Stacked upwards and backwards
            const backOffset = Math.abs(offset);
            translateY = backOffset * -45; 
            translateZ = backOffset * -80; 
            rotateX = backOffset * -2;     
        } else {
            // Folding down like a drawbridge
            const foldProgress = Math.min(1, offset);
            const extraOffset = Math.max(0, offset - 1);
            const easeProgress = 1 - Math.pow(1 - foldProgress, 3);
            
            translateY = (easeProgress * 280) + (extraOffset * 35);
            translateZ = (easeProgress * 50) + (extraOffset * 10); 
            rotateX = (easeProgress * -82); 
        }

        const zIndex = Math.round(100 - Math.abs(offset) * 10);

        cardEl.style.transform = `translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg)`;
        cardEl.style.zIndex = zIndex;
        cardEl.style.opacity = opacity;
      });
    };

    scrollContainer.addEventListener('scroll', updateCards, { passive: true });
    window.addEventListener('resize', updateCards);
    
    // Initial setup
    updateCards();

    return () => {
      scrollContainer.removeEventListener('scroll', updateCards);
      window.removeEventListener('resize', updateCards);
    };
  }, []);

  return (
    <div className="documents-screen">
      {/* We need the top nav bar to be z-indexed above the scroll spacer */}
      <div style={{ position: 'relative', zIndex: 50 }}>
        <TopNavBar variant="inner" title="Documents" onBack={onBack} transparent={true} />
      </div>

      <div className="sticky-viewport">
        <div id="stack" className="stack-container">
          {cardData.map((card, i) => (
            <div
              key={card.id}
              ref={el => cardsRef.current[i] = el}
              className="doc-card"
              style={{ backgroundColor: card.color }}
            >
              <h2 className="doc-card-label">{card.label}</h2>
              
              {card.number && <span className="doc-badge-num">{card.number}</span>}
              
              {card.hasSpheres && (
                <div className="doc-spheres-container">
                  <div className="doc-sphere doc-sphere-1"></div>
                  <div className="doc-sphere doc-sphere-2"></div>
                  <div className="doc-sphere doc-sphere-3"></div>
                </div>
              )}
              
              <div className="doc-top-dash"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="doc-scroll-spacer"></div>
    </div>
  );
}
