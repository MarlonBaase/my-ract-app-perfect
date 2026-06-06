import { useState } from 'react';

export default function Support() {
  const [abgesendet, setAbgesendet] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setAbgesendet(true);
  };

  if (abgesendet) {
    return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <button onClick={false}>Close</button>
      </div>
    </div>,
    document.body
  );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Gebe deine E-Mail-Adresse ein:
        <input type="email" />
      </label>
      <label>
        Gebe deine Telefonnummer ein:
        <input type="text" />
      </label>
      <label>
        Gib das Problem ein, das du hast:
        <input type="text" />
      </label>
      <button type="submit">Absenden</button>
    </form>
  );
}