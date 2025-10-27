export function MapDebug() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'white',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '12px',
      maxWidth: '300px',
      wordBreak: 'break-all',
      zIndex: 9999
    }}>
      <strong>Debug Info:</strong><br/>
      API Key Present: {apiKey ? 'YES' : 'NO'}<br/>
      {apiKey && `Key: ${apiKey.substring(0, 20)}...`}
    </div>
  );
}
