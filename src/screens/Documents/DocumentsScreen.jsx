import React from 'react';
import TopNavBar from '../../navigation/TopNavBar.jsx';

export default function DocumentsScreen({ onBack }) {
  return (
    <div className="documents-screen">
      <TopNavBar variant="inner" title="Documents" onBack={onBack} />
      <div className="documents-content" style={{ padding: '20px', textAlign: 'center', marginTop: '60px' }}>
        <p>Your documents will appear here.</p>
      </div>
    </div>
  );
}
