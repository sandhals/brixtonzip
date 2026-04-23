import UnzipToggle from './UnzipToggle';

export default function UnzipBox() {
  return (
    <div style={{ position: 'relative' }}>
      <img src="/images/me.png" alt="dithered gym selfie" />
      <UnzipToggle checkboxId="open" />
    </div>
  );
}
