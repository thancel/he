import { useState, useEffect } from 'react'
import axios from 'axios'

function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/users/recent')
      ])
      setStats(statsRes.data)
      setRecentUsers(usersRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <div className="container">
        <div className="navbar">
          <h1>🤖 HeFang Bot Dashboard</h1>
        </div>
        <div className="card">
          <p style={{ textAlign: 'center', fontSize: '18px' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="navbar">
        <h1>🤖 HeFang Bot Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#666' }}>Welcome, {user.username}!</span>
          <button className="button logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>📊 Bot Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>SERVERS</h3>
            <p>{stats.guilds}</p>
          </div>
          <div className="stat-card">
            <h3>REGISTERED USERS</h3>
            <p>{stats.users}</p>
          </div>
          <div className="stat-card">
            <h3>TOTAL GIVEAWAYS</h3>
            <p>{stats.totalGiveaways}</p>
          </div>
          <div className="stat-card">
            <h3>ACTIVE GIVEAWAYS</h3>
            <p>{stats.activeGiveaways}</p>
          </div>
          <div className="stat-card">
            <h3>TOTAL CREDITS</h3>
            <p>{stats.totalBalance.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>UPTIME</h3>
            <p style={{ fontSize: '18px' }}>{formatUptime(stats.uptime)}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>👥 Recent Users</h2>
        <div className="user-list">
          {recentUsers.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>No users yet</p>
          ) : (
            recentUsers.map(user => (
              <div key={user.id} className="user-item">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="user-avatar" />
                ) : (
                  <div className="user-avatar" style={{ 
                    background: '#5865F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="user-info">
                  <h4>{user.username}</h4>
                  <p>Balance: {user.balance.toLocaleString()} Credits • Streak: {user.dailyStreak} days</p>
                </div>
                <div style={{ textAlign: 'right', color: '#666', fontSize: '12px' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>ℹ️ About</h2>
        <p style={{ color: '#666', lineHeight: '1.6' }}>
          This dashboard provides real-time monitoring of your Discord bot. 
          View server statistics, user activity, giveaways, and more. 
          The data automatically refreshes every 30 seconds.
        </p>
      </div>
    </div>
  )
}

export default Dashboard