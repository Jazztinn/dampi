export default function FinancialAssistanceScreen() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Financial Assistance Layer</h1>
      <p>Find available financial assistance options (PCSO, DSWD, Malasakit).</p>

      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Available Programs</h3>
        <ul>
          <li>PCSO Medical Assistance</li>
          <li>DSWD Assistance to Individuals in Crisis Situations (AICS)</li>
          <li>Malasakit Center Services</li>
          <li>Barangay Aid</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Requirements & How to Apply</h3>
        <p><em>(Clear, step-by-step instructions on what documents are needed)</em></p>
      </div>
    </div>
  );
}
