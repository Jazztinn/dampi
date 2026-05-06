import React, { useEffect, useRef, useState } from 'react';
import TopNavBar from '../../navigation/TopNavBar.jsx';
import './documents.css';

const COLORS = ["#facc15", "#22c55e", "#38bdf8", "#f87171", "#f472b6", "#fbbf24", "#4ade80"];
const LABELS = ["Invoice", "Contract", "Receipt", "Proposal", "Report", "Memo", "Prescription", "Lab Result"];

export default function DocumentsScreen({ onBack }) {
  const [cards, setCards] = useState([
    { id: 'create-btn', label: "Create document", color: "#facc15", hasSpheres: true }
  ]);
  const cardsRef = useRef([]);

  useEffect(() => {
    // The main scroll container is `.content-area` from AppNavigator.jsx
    const scrollContainer = document.querySelector('.content-area');
    if (!scrollContainer) return;

    // Enable scroll snapping on the container to snap to the invisible spacer divs
    scrollContainer.style.scrollSnapType = 'y mandatory';

    const updateCards = () => {
      const scrollY = scrollContainer.scrollTop;
      const height = scrollContainer.clientHeight;
      const maxScroll = scrollContainer.scrollHeight - height;
      
      const totalCards = cards.length;
      
      // If content isn't tall enough yet, don't break. Force 0 progress.
      const scrollProgress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;
      
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
      scrollContainer.style.scrollSnapType = '';
      scrollContainer.removeEventListener('scroll', updateCards);
      window.removeEventListener('resize', updateCards);
    };
  }, [cards.length]);

  const handleCardClick = (card) => {
    if (card.id === 'create-btn') {
      const newCard = {
        id: Date.now(),
        label: LABELS[Math.floor(Math.random() * LABELS.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        hasSpheres: Math.random() > 0.5,
      };
      
      // Prepend to the array so the "Create document" card stays at the very bottom (front of stack at 0 scroll)
      setCards(prev => [newCard, ...prev]);
    }
  };

  return (
    <div className="documents-screen">
      {/* We need the top nav bar to be z-indexed above the scroll spacer */}
      <div style={{ position: 'relative', zIndex: 50 }}>
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

      <div className="doc-scroll-spacer">
        {/* Invisible snap points to force precise scroll intervals */}
        {cards.map((c, i) => (
          <div key={i} style={{ height: 'calc(100vh - 140px)', scrollSnapAlign: 'start' }} />
        ))}
        {/* Extra padding at bottom to ensure the last snap point can be reached smoothly */}
        <div style={{ height: '140px' }} />
      </div>
    </div>
  );
}
