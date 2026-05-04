export default function SymptomGuideScreen() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Symptom Guide (Gabay sa Sintomas)</h1>
      <p>This is where the parent will describe the symptoms.</p>
      
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Step 1: Report freely</h3>
        <p><em>(E.g., "Mainit ang ulo niya, may pula sa balat")</em></p>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Step 2: AI Examination Guide</h3>
        <p><em>(Tailored instructions and images based on report)</em></p>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Step 3: Checklist</h3>
        <p><em>(Specific questions about the symptoms)</em></p>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Step 4: Summary</h3>
        <p><em>(One-page clinical summary for the doctor)</em></p>
      </div>
    </div>
  );
}
