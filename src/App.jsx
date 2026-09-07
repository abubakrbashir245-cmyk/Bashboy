import { useCallback, useEffect, useState } from 'react'
import './App.css'

const SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard'
const DRAFT_KINGS_LOGO = 'https://a.espncdn.com/i/betting/Draftkings_Dark.svg'

function getTeams(competition) {
  const competitors = competition.competitors ?? []
  return {
    home: competitors.find((team) => team.homeAway === 'home') ?? competitors[0],
    away: competitors.find((team) => team.homeAway === 'away') ?? competitors[1],
  }
}

function getMatchStatus(status) {
  if (status?.type?.state === 'in') return `LIVE ${status.displayClock || status.detail || ''}`.trim()
  return status?.type?.shortDetail || status?.type?.detail || 'Scheduled'
}

function App() {
  const [fixtures, setFixtures] = useState([])
  const [status, setStatus] = useState('loading')
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadFixtures = useCallback(async (signal) => {
    try {
      const response = await fetch(SCOREBOARD_URL, { signal })
      if (!response.ok) throw new Error(`Scoreboard request failed: ${response.status}`)
      const data = await response.json()
      setFixtures(data.events ?? [])
      setLastUpdated(new Date())
      setStatus('success')
    } catch (error) {
      if (error.name !== 'AbortError') setStatus('error')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const initialLoad = window.setTimeout(() => loadFixtures(controller.signal), 0)
    const refreshTimer = window.setInterval(() => loadFixtures(), 60_000)
    return () => {
      controller.abort()
      window.clearTimeout(initialLoad)
      window.clearInterval(refreshTimer)
    }
  }, [loadFixtures])

  return (
    <main className="app-shell">
      <SiteHeader />
      <section className="hero">
        <p className="eyebrow">Premier League <span>/</span> Matchday centre</p>
        <h1>The beautiful game<span className="title-dot">.</span></h1>
        <p className="intro-copy">Scores and fixtures from England&apos;s top flight, refreshed automatically every minute.</p>
      </section>

      <FootballPage fixtures={fixtures} status={status} lastUpdated={lastUpdated} onRefresh={() => { setStatus('loading'); loadFixtures() }} />
      <SiteFooter />
    </main>
  )
}

function SiteHeader() {
  return <header className="site-header">
    <a className="brand" href="/">
      <span className="brand-mark">90</span>
      <span>Matchday</span>
    </a>
    <nav aria-label="Sections"><a className="nav-link active" href="#fixtures">Fixtures</a><a className="nav-link" href="#table">The table</a></nav>
    <div className="edition"><span className="status-dot"></span>Live feeds</div>
  </header>
}

function FootballPage({ fixtures, status, lastUpdated, onRefresh }) {
  return <section className="content-section football-page" id="fixtures">
    <div className="section-heading"><div><p className="section-kicker">Match centre</p><h2>On the pitch</h2>{lastUpdated && <p className="updated">Updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>}<div className="odds"><img src={DRAFT_KINGS_LOGO} alt="" /> <span>Odds by Draft Kings</span></div></div><button className="refresh-button" type="button" onClick={onRefresh} disabled={status === 'loading'}>{status === 'loading' ? 'Updating...' : 'Refresh scores'}</button></div>
    {status === 'loading' && fixtures.length === 0 && <LoadingState />}
    {status === 'error' && <p className="message error">Scores could not be loaded. Check your connection and try again.</p>}
    {status === 'success' && fixtures.length === 0 && <p className="message">No Premier League matches are scheduled for today.</p>}
    {fixtures.length > 0 && <div className="fixture-grid">{fixtures.map((event) => {
      const competition = event.competitions?.[0] ?? {}
      const { home, away } = getTeams(competition)
      const fixtureStatus = competition.status ?? event.status
      return <article className="fixture-card" key={event.id}>
        <div className="fixture-top"><span className={fixtureStatus?.type?.state === 'in' ? 'live-text' : ''}>{getMatchStatus(fixtureStatus)}</span><span>{competition.venue?.displayName ?? 'Premier League'}</span></div>
        <div className="odds card-odds"><img src={DRAFT_KINGS_LOGO} alt="" /><span>Draft Kings</span></div>
        <div className="card-teams">{[home, away].filter(Boolean).map((team) => <div className="team" key={team.id}><span className="team-name">{team.team?.logo && <img src={team.team.logo} alt="" />}{team.team?.displayName ?? 'TBC'}</span><strong>{team.score ?? '-'}</strong></div>)}</div>
        {event.date && <p className="fixture-date">{new Date(event.date).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</p>}
      </article>
    })}</div>}
    <p className="source-note">Source: ESPN · English Premier League</p>
  </section>
}

function LoadingState() {
  return <div className="loading-state"><span className="loader"></span><p>Gathering live fixtures...</p></div>
}

function SiteFooter() {
  return <footer><span>MD / 2026</span><span>Football, in real time.</span><span>Scroll to explore</span></footer>
}

export default App
