export default function HMOPortalScreen() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>HMO & PhilHealth Portal</h1>
      <p>Manage and view available health coverage limits.</p>

      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Existing Coverage</h3>
        <p><em>(Track remaining Maximum Benefit Limit)</em></p>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>No Coverage / PhilHealth Options</h3>
        <p><em>(Plain-language explanation of benefits and how to apply)</em></p>
      </div>
    </div>
  );
}
