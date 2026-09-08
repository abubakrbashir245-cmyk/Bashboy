import { useEffect, useState } from 'react'
import './App.css'

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '4ca8b5cab2d64f1db32125038261908'
const CITY = 'Lagos,NG'

const DEMO_DATA = {
  humidity: 77,
  temp: 28,
  status: 'Very humid',
  emoji: '😮‍💨',
  desc: 'Steady at 77%. Extremely humid conditions expected in the evening.',
}

function getStatus(humidity) {
  if (humidity >= 80) return { label: 'Very humid', emoji: '😮‍💨', desc: `Steady at ${humidity}%. Extremely humid conditions expected in the evening.` }
  if (humidity >= 60) return { label: 'Humid', emoji: '😓', desc: `Humidity at ${humidity}%. Muggy conditions.` }
  if (humidity >= 40) return { label: 'Comfortable', emoji: '😊', desc: `Humidity at ${humidity}%. Comfortable conditions.` }
  return { label: 'Dry', emoji: '😮', desc: `Humidity at ${humidity}%. Dry conditions.` }
}

function calculateDewPoint(temp, humidity) {
  return Math.round(temp - (100 - humidity) / 5)
}

function HumidityCard() {
  const [humidity, setHumidity] = useState(DEMO_DATA.humidity)
  const [dew, setDew] = useState(24)
  const [status, setStatus] = useState(getStatus(DEMO_DATA.humidity))

  useEffect(() => {
    let ignore = false

    async function getHumidityData() {
      try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`)
        if (!response.ok) throw new Error('Weather request failed')

        const data = await response.json()
        const nextHumidity = data.main?.humidity ?? DEMO_DATA.humidity
        const currentTemp = data.main?.temp ?? DEMO_DATA.temp
        if (ignore) return

        setHumidity(nextHumidity)
        setDew(calculateDewPoint(currentTemp, nextHumidity))
        setStatus(getStatus(nextHumidity))
      } catch (error) {
        console.warn('Weather API unavailable, using demo data', error)
      }
    }

    getHumidityData()
    return () => { ignore = true }
  }, [])

  const filledBars = Math.round((humidity / 100) * 7)

  return (
    <main className="weather-page">
      <section className="humidity-card" aria-labelledby="humidity-title">
        <div className="card-header">
          <div>
            <p className="eyebrow">Live weather / Lagos</p>
            <h1 id="humidity-title">Humidity</h1>
          </div>
          <span className="weather-dot" aria-label="Live data" />
        </div>

        <div className="humidity-summary">
          <div className="humidity-bars" aria-label={`${humidity}% relative humidity`}>
            {Array.from({ length: 7 }).map((_, index) => (
              <span
                key={index}
                className={index < filledBars ? 'humidity-bar filled' : 'humidity-bar'}
                style={{ height: `${(index + 1) * 18}px` }}
              />
            ))}
          </div>

          <div className="measurements">
            <p className="large-measurement">{humidity}<span>%</span></p>
            <p className="measurement-label">Relative Humidity</p>
            <p className="dew-measurement">{dew}<span>°</span></p>
            <p className="measurement-label">Dew point</p>
          </div>
        </div>

        <p className="humidity-status">{status.label} <span>{status.emoji}</span></p>
        <p className="humidity-description">{status.desc}</p>
      </section>
    </main>
  )
}

export default HumidityCard
