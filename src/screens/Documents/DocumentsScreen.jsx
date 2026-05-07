import React, { useEffect, useRef, useState } from 'react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import './documents.css';

export default function DocumentsScreen({ onBack }) {
  const [cards, setCards] = useState([
    { id: 'create-btn', label: "Create document", color: "#facc15", hasSpheres: true }
  ]);
  const cardsRef = useRef([]);

  useEffect(() => {
    // The main scroll container is `.content-area` from AppNavigator.jsx
    const scrollContainer = document.querySelector('.content-area');
    if (!scrollContainer) return;

    const updateCards = () => {
      const scrollY = scrollContainer.scrollTop;
      const height = scrollContainer.clientHeight;
      const maxScroll = scrollContainer.scrollHeight - height;
      
      const totalCards = cards.length;
      const scrollProgress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;
      
      const scrollValue = scrollProgress * (totalCards - 1);
      const activeIndex = Math.floor(scrollValue);
      const localProgress = scrollValue - activeIndex;

      cardsRef.current.forEach((cardEl, i) => {
        if (!cardEl) return;
        
        // pos 0 is the front card. pos 1 is behind it, etc.
        const pos = (totalCards - 1) - i;
        
        let translateY = 0;
        let translateZ = 0;
        let rotateX = 0;
        let opacity = 1;
        let zIndex = 100 - pos;

        if (pos < activeIndex) {
            // Cards that have completely folded away
            const offsetPastActive = activeIndex - pos + localProgress;
            translateY = 280 + (offsetPastActive * 35);
            translateZ = 50 + (offsetPastActive * 10);
            rotateX = -82;
            opacity = Math.max(0, 1 - (offsetPastActive * 0.4));
            zIndex = pos; // Pushed to the bottom of the stack
            
        } else if (pos === activeIndex) {
            // The currently active card. It stays flat for the first 50% of the scroll, then folds down.
            if (localProgress < 0.5) {
                // Card is flat and fully active. The stack behind it is also frozen.
                translateY = 0;
                translateZ = 0;
                rotateX = 0;
            } else {
                // Card begins folding down like a drawbridge
                const foldProgress = (localProgress - 0.5) * 2; // scale 0.5->1.0 to 0->1.0
                const easeProgress = 1 - Math.pow(1 - foldProgress, 3);
                
                translateY = easeProgress * 280;
                translateZ = easeProgress * 50;
                rotateX = easeProgress * -82;
                zIndex = 100; // Keep on top while folding
            }
        } else {
            // Cards behind the active card.
            const stackPos = pos - activeIndex;
            
            if (localProgress < 0.5) {
                // Frozen in place waiting for the active card to fold
                translateY = stackPos * -45;
                translateZ = stackPos * -80;
                rotateX = stackPos * -2;
            } else {
                // Stepping forward into the active position
                const advanceProgress = (localProgress - 0.5) * 2; // scale 0.5->1.0 to 0->1.0
                const currentStackPos = stackPos - advanceProgress;
                
                translateY = currentStackPos * -45;
                translateZ = currentStackPos * -80;
                rotateX = currentStackPos * -2;
            }
        }

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
  }, [cards.length]);

  const handleCardClick = (card) => {
    if (card.id === 'create-btn') {
      const newCard = {
        id: Date.now(),
        label: "",
        color: "#ffffff",
        hasSpheres: false,
      };
      
      // Prepend to the array so the "Create document" card stays at the very bottom (front of stack at 0 scroll)
      setCards(prev => [newCard, ...prev]);
    }
  };

  return (
    <div className="documents-screen">
      <div className="doc-sticky-wrapper">
        {/* We need the top nav bar to be z-indexed above the scroll spacer */}
        <div style={{ position: 'relative', zIndex: 150, pointerEvents: 'auto' }}>
          <TopNavBar variant="inner" title="Documents" onBack={onBack} transparent={true} />
        </div>

        <div className="sticky-viewport">
          <div id="stack" className="stack-container">
            {cards.map((card, i) => (
              <div
                key={card.id}
                ref={el => cardsRef.current[i] = el}
                className="doc-card"
                style={{ backgroundColor: card.color }}
                onClick={() => handleCardClick(card)}
              >
                <h2 className="doc-card-label" style={{ color: card.color === '#ffffff' ? '#1f2937' : 'white' }}>{card.label}</h2>
                
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
          <div className="doc-bottom-fade"></div>
          <div className="doc-bottom-blur"></div>
        </div>
      </div>

      {/* Dynamic scroll spacer to allow scrolling through all cards. 
          0 extra height if there's only 1 card, preventing useless scrolling. */}
      <div className="doc-scroll-spacer" style={{ height: `${Math.max(0, cards.length - 1) * 250}px` }}></div>
    </div>
  );
}
