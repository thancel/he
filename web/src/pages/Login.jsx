function Login() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/discord'
  }

  return (
    <div className="container" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>
      <div className="card" style={{ 
        textAlign: 'center', 
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          marginBottom: '16px',
          color: '#5865F2'
        }}>
          🤖 HeFang Bot
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: '#666', 
          marginBottom: '32px' 
        }}>
          Welcome to the bot dashboard. Login with Discord to continue.
        </p>
        <button className="button" onClick={handleLogin}>
          <span style={{ marginRight: '8px' }}>🔐</span>
          Login with Discord
        </button>
        <p style={{ 
          fontSize: '12px', 
          color: '#999', 
          marginTop: '24px' 
        }}>
          Only the bot owner can access this dashboard
        </p>
      </div>
    </div>
  )
}

export default Login