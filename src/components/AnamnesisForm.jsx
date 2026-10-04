import { useEffect, useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import api from '../services/api'
import './AnamnesisForm.css'

const QUESTIONS = [
  { field: 'had_previous_extension', notes: 'had_previous_extension_notes', text: 'Já fez extensão de cílios antes? Se sim, teve alguma reação?' },
  { field: 'has_allergies', notes: 'has_allergies_notes', text: 'Possui alguma alergia conhecida (esmaltes, cosméticos, cianoacrilato, etc)?' },
  { field: 'uses_contact_lenses', notes: 'uses_contact_lenses_notes', text: 'Usa lentes de contato? (Necessário remover durante o procedimento)' },
  { field: 'has_eye_problems', notes: 'has_eye_problems_notes', text: 'Possui algum problema ocular? (Blefarite, glaucoma, olho seco, conjuntivite recente)' },
  { field: 'recent_eye_procedure', notes: 'recent_eye_procedure_notes', text: 'Fez cirurgia ocular recente ou procedimento estético na região (Ex: PMU, Botox)?' },
  { field: 'thyroid_alopecia_hormonal', notes: 'thyroid_alopecia_hormonal_notes', text: 'Tem problemas de tireoide, alopecia ou está passando por alterações hormonais?' },
  { field: 'pregnant_or_treatment', notes: 'pregnant_or_treatment_notes', text: 'Está gestante, lactante ou em tratamento médico/oncológico?' },
  { field: 'pulls_lashes_or_sleeps_prone', notes: 'pulls_lashes_or_sleeps_prone_notes', text: 'Tem mania de puxar ou esfregar os cílios? Costuma dormir de bruços?' },
]

const createInitialForm = () => ({
  full_name: '', birth_date: '', whatsapp: '', instagram: '', profession: '', how_met: '',
  ...Object.fromEntries(QUESTIONS.flatMap(({ field, notes }) => [[field, ''], [notes, '']])),
  consent_accepted: false, signed_date: '', signature: '',
})

const apiErrorMessage = (error) => {
  const details = error.response?.data
  if (!details || typeof details !== 'object') return 'Não foi possível carregar a ficha.'
  return Object.values(details).flat().join(' ')
}

export default function AnamnesisForm({ onSubmit, onCancel, submitting = false, serverErrors = null, clientId = null }) {
  const [form, setForm] = useState(createInitialForm)
  const [errors, setErrors] = useState({})
  const [prefilled, setPrefilled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const signatureRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setLoadError(null)
    setPrefilled(false)
    setForm(createInitialForm())

    api.get('/anamneses/prefill/', { params: clientId ? { client_id: clientId } : {} })
      .then(({ data }) => {
        if (data && typeof data === 'object') {
          const previous = data.anamnesis || data
          setForm((current) => ({ ...current, ...previous, consent_accepted: false, signed_date: '', signature: '' }))
          setPrefilled(true)
        }
      })
      .catch((error) => {
        if (error.response?.status !== 204) setLoadError(apiErrorMessage(error))
      })
      .finally(() => setLoading(false))
  }, [clientId])

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.full_name.trim()) nextErrors.full_name = 'Informe seu nome completo.'
    if (!form.birth_date) nextErrors.birth_date = 'Informe sua data de nascimento.'
    QUESTIONS.forEach(({ field }) => {
      if (form[field] !== true && form[field] !== false) nextErrors[field] = 'Escolha Sim ou Não.'
    })
    if (!form.consent_accepted) nextErrors.consent_accepted = 'É necessário aceitar o termo.'
    if (!form.signed_date) nextErrors.signed_date = 'Informe a data.'
    if (!form.signature || signatureRef.current?.isEmpty()) nextErrors.signature = 'Faça sua assinatura.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submit = (event) => {
    event.preventDefault()
    if (!validate()) return

    onSubmit({
      ...form,
      signature: signatureRef.current.toDataURL('image/png'),
      consent_accepted: true,
    })
  }

  const errorFor = (field) => {
    const serverError = serverErrors?.[field] || serverErrors?.anamnesis?.[field]
    const message = errors[field] || (Array.isArray(serverError) ? serverError.join(' ') : serverError)
    return message && <span className="anamnesis-error">{message}</span>
  }

  return (
    <form className="anamnesis-form" onSubmit={submit}>
      <div className="anamnesis-heading">
        <p className="anamnesis-kicker">Ficha de anamnese</p>
        <h3>Extensão de cílios &amp; design do olhar</h3>
        <p>Preencha antes de confirmar seu agendamento.</p>
      </div>

      {loading && <p className="anamnesis-feedback">Carregando seus dados...</p>}
      {prefilled && <p className="anamnesis-notice">Dados da sua última ficha, confira se continuam corretos.</p>}
      {loadError && <p className="anamnesis-feedback error">{loadError}</p>}

      <section className="anamnesis-section">
        <h4>1. Dados pessoais</h4>
        <div className="anamnesis-fields">
          <label>Nome completo<input value={form.full_name} onChange={(event) => update('full_name', event.target.value)} />{errorFor('full_name')}</label>
          <label>Data de nascimento<input type="date" value={form.birth_date} onChange={(event) => update('birth_date', event.target.value)} />{errorFor('birth_date')}</label>
          <label>WhatsApp<input value={form.whatsapp} onChange={(event) => update('whatsapp', event.target.value)} />{errorFor('whatsapp')}</label>
          <label>Instagram<input value={form.instagram} onChange={(event) => update('instagram', event.target.value)} /></label>
          <label>Profissão<input value={form.profession} onChange={(event) => update('profession', event.target.value)} /></label>
          <label>Como nos conheceu?<input value={form.how_met} onChange={(event) => update('how_met', event.target.value)} /></label>
        </div>
      </section>

      <section className="anamnesis-section">
        <h4>2. Questionário de saúde &amp; histórico ocular</h4>
        <div className="anamnesis-questions">
          {QUESTIONS.map((question, index) => (
            <fieldset key={question.field} className="anamnesis-question">
              <legend>{index + 1}. {question.text}</legend>
              <div className="anamnesis-radios">
                <label><input type="radio" name={question.field} checked={form[question.field] === true} onChange={() => update(question.field, true)} /> Sim</label>
                <label><input type="radio" name={question.field} checked={form[question.field] === false} onChange={() => update(question.field, false)} /> Não</label>
              </div>
              {errorFor(question.field)}
              <label className="anamnesis-notes">Observações<textarea value={form[question.notes]} onChange={(event) => update(question.notes, event.target.value)} rows="2" /></label>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="anamnesis-section">
        <h4>3. Termo de responsabilidade e consentimento</h4>
        <p className="anamnesis-term">Estou ciente de que o procedimento de extensão de cílios requer cuidados específicos após a aplicação (não molhar nas primeiras horas, não usar rímel à prova d'água, não esfregar os olhos e pentear diariamente). Declaro que todas as informações prestadas acima são verdadeiras e omitir qualquer dado é de minha total responsabilidade. Autorizo a realização do procedimento, bem como o registro fotográfico dos meus olhos para acompanhamento técnico e divulgação profissional.</p>
        <label className="anamnesis-consent"><input type="checkbox" checked={form.consent_accepted} onChange={(event) => update('consent_accepted', event.target.checked)} /> Li e concordo</label>
        {errorFor('consent_accepted')}
        <label>Data<input type="date" value={form.signed_date} onChange={(event) => update('signed_date', event.target.value)} />{errorFor('signed_date')}</label>
        <div className="anamnesis-signature-field">
          <div className="anamnesis-signature-box">
            <SignatureCanvas ref={signatureRef} penColor="#2c2c2c" canvasProps={{ className: 'anamnesis-signature-canvas' }} onEnd={() => update('signature', 'signed')} />
            {!form.signature && <span className="anamnesis-signature-placeholder">Assine aqui</span>}
          </div>
          <button type="button" className="anamnesis-clear" onClick={() => { signatureRef.current.clear(); update('signature', '') }}>Limpar</button>
          {errorFor('signature')}
        </div>
      </section>

      <div className="anamnesis-actions">
        <button type="button" className="anamnesis-cancel" onClick={onCancel} disabled={submitting}>Voltar</button>
        <button type="submit" className="anamnesis-submit" disabled={submitting || loading}>{submitting ? 'Confirmando...' : 'Confirmar agendamento'}</button>
      </div>
    </form>
  )
}