import dampiIcon from '../../assets/dampi.svg';
import '../../styles/dampi-fab.css';

export default function DampiFab({ onOpenChat }) {
  return (
    <div className="bottom-nav">
      <div className="nav-fab-wrap">
        <button className="nav-fab" onClick={() => onOpenChat?.('text')}>
          <img src={dampiIcon} alt="Dampi" className="dampi-icon" style={{ width: '32px', height: '32px' }} />
        </button>
      </div>
    </div>
  );
}
