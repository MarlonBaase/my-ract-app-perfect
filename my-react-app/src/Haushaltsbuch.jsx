import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function Haushaltsbuch() {
  const [startkapital, setStartkapital] = useState(0)
  const [kapital, setKapital] = useState(0)
  const [neuesStartkapital, setNeuesStartkapital] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [betrag, setBetrag] = useState('')
  const [eintraege, setEintraege] = useState([])

  useEffect(() => {
    ladeAlles()
  }, [])

  const ladeAlles = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: kapitalData } = await supabase
      .from('kapital')
      .select('betrag')
      .eq('user_id', user.id)
      .single()

    const start = kapitalData?.betrag ?? 0
    setStartkapital(start)

    const { data: ausgaben } = await supabase
      .from('haushaltsbuch')
      .select('*')
      .order('erstellt_am', { ascending: false })

    if (ausgaben) {
      setEintraege(ausgaben)
      const gesamt = ausgaben.reduce((sum, e) => sum - e.betrag, start)
      setKapital(gesamt)
    } else {
      setKapital(start)
    }
  }

  const startkapitalSpeichern = async () => {
    if (!neuesStartkapital) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('kapital').upsert({
      user_id: user.id,
      betrag: parseFloat(neuesStartkapital)
    }, { onConflict: 'user_id' })
    setNeuesStartkapital('')
    ladeAlles()
  }

  const ausgabeHinzufuegen = async () => {
    if (!beschreibung || !betrag) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('haushaltsbuch').insert({
      user_id: user.id,
      beschreibung,
      betrag: parseFloat(betrag)
    })
    setBeschreibung('')
    setBetrag('')
    ladeAlles()
  }

  return (
    <div>
      <h2>Haushaltsbuch</h2>

      <div>
        <h3>Aktuelles Kapital: {kapital.toFixed(2)} €</h3>
      </div>

      <div>
        <h4>Startkapital setzen</h4>
        <input
          placeholder={`Aktuell: ${startkapital.toFixed(2)} €`}
          type="number"
          value={neuesStartkapital}
          onChange={e => setNeuesStartkapital(e.target.value)}
        />
        <button onClick={startkapitalSpeichern}>Speichern</button>
      </div>

      <div>
        <h4>Ausgabe hinzufügen</h4>
        <input
          placeholder="Beschreibung"
          value={beschreibung}
          onChange={e => setBeschreibung(e.target.value)}
        />
        <input
          placeholder="Betrag in €"
          type="number"
          value={betrag}
          onChange={e => setBetrag(e.target.value)}
        />
        <button onClick={ausgabeHinzufuegen}>Ausgabe abziehen</button>
      </div>

      <ul>
        {eintraege.map(e => (
          <li key={e.id}>
            {e.beschreibung}: -{e.betrag.toFixed(2)} €
          </li>
        ))}
      </ul>
    </div>
  )
}