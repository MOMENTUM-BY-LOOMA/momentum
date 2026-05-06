import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderConAtras from '../components/HeaderConAtras'
import { fetchCurrentUser, updateCurrentUserPreferences, type ApiUserPreferences } from '../services/api'
import { applyUserPreferences, normalizeUserPreferences, type NormalizedUserPreferences } from '../services/userPreferences'

const DEFAULT_PREFS: NormalizedUserPreferences = {
  theme: 'claro',
  language: 'es',
  textSize: 'normal',
  reduceAnimations: false,
  emphasizeFocus: false,
  easyReadMode: false,
}

function SettingsPreferencesPage() {
  const navigate = useNavigate()
  const [originalPrefs, setOriginalPrefs] = useState<NormalizedUserPreferences>(DEFAULT_PREFS)
  const [prefs, setPrefs] = useState<NormalizedUserPreferences>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const ui = prefs.language === 'en'
    ? {
      title: 'SELECT YOUR PREFERENCES',
      back: '← BACK',
      language: 'Language',
      textSize: 'Text size',
      small: 'Small',
      normal: 'Normal',
      large: 'Large',
      reduceAnimations: 'Reduce animations',
      emphasizeFocus: 'Emphasize focus',
      easyRead: 'Easy read mode',
      save: 'SAVE CHANGES',
      saving: 'SAVING...',
      saved: 'Preferences saved',
      loadError: 'Could not load preferences',
      saveError: 'Could not save preferences',
    }
    : {
      title: 'SELECCIONA TUS PREFERENCIAS',
      back: '← ATRAS',
      language: 'Idioma',
      textSize: 'Tamano del texto',
      small: 'Pequeno',
      normal: 'Normal',
      large: 'Grande',
      reduceAnimations: 'Reducir animaciones',
      emphasizeFocus: 'Enfatizar foco',
      easyRead: 'Modo lectura facil',
      save: 'GUARDAR CAMBIOS',
      saving: 'GUARDANDO...',
      saved: 'Preferencias guardadas',
      loadError: 'No se pudieron cargar las preferencias',
      saveError: 'No se pudieron guardar',
    }

  useEffect(() => {
    const load = async () => {
      try {
        const user = await fetchCurrentUser()
        const userPrefs = {
          ...DEFAULT_PREFS,
          ...(user.preferences || {}),
        }
        setOriginalPrefs(userPrefs)
        setPrefs(userPrefs)
        applyUserPreferences(userPrefs)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : ui.loadError)
      }
    }

    load()
  }, [])

  async function handleSave() {
    setLoading(true)
    setError('')
    setSuccess('')

    const changed: ApiUserPreferences = {}

    if (prefs.language !== originalPrefs.language) changed.language = prefs.language
    if (prefs.textSize !== originalPrefs.textSize) changed.textSize = prefs.textSize
    if (prefs.reduceAnimations !== originalPrefs.reduceAnimations) changed.reduceAnimations = prefs.reduceAnimations
    if (prefs.emphasizeFocus !== originalPrefs.emphasizeFocus) changed.emphasizeFocus = prefs.emphasizeFocus
    if (prefs.easyReadMode !== originalPrefs.easyReadMode) changed.easyReadMode = prefs.easyReadMode

    try {
      if (Object.keys(changed).length > 0) {
        const updatedUser = await updateCurrentUserPreferences(changed)
        const updatedPrefs = normalizeUserPreferences(updatedUser.preferences)
        setOriginalPrefs(updatedPrefs)
        setPrefs(updatedPrefs)
        localStorage.setItem('authUser', JSON.stringify(updatedUser))
        applyUserPreferences(updatedPrefs)
        window.dispatchEvent(new Event('authUserChanged'))
      }

      setSuccess(ui.saved)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : ui.saveError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Fragment>
      <HeaderConAtras onAtras={() => navigate(-1)} />
      <section className="settings-mobile" aria-label="Ajustes de preferencias">

      <h1 className="settings-title">{ui.title}</h1>

      <div className="settings-form settings-form--spacious">
        <label className="settings-label" htmlFor="settings-language">{ui.language}</label>
        <select
          id="settings-language"
          className="settings-select"
          value={prefs.language}
          onChange={(event) => setPrefs((prev) => ({ ...prev, language: event.target.value as 'es' | 'en' }))}
        >
          <option value="es">Espanol</option>
          <option value="en">English</option>
        </select>

        <label className="settings-label" htmlFor="settings-text-size">{ui.textSize}</label>
        <select
          id="settings-text-size"
          className="settings-select"
          value={prefs.textSize}
          onChange={(event) => setPrefs((prev) => ({ ...prev, textSize: event.target.value as 'small' | 'normal' | 'large' }))}
        >
          <option value="small">{ui.small}</option>
          <option value="normal">{ui.normal}</option>
          <option value="large">{ui.large}</option>
        </select>

        <div className="settings-switch-row">
          <span>{ui.reduceAnimations}</span>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={prefs.reduceAnimations}
              onChange={(event) => setPrefs((prev) => ({ ...prev, reduceAnimations: event.target.checked }))}
            />
            <span className="settings-switch__slider" />
          </label>
        </div>

        <div className="settings-switch-row">
          <span>{ui.emphasizeFocus}</span>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={prefs.emphasizeFocus}
              onChange={(event) => setPrefs((prev) => ({ ...prev, emphasizeFocus: event.target.checked }))}
            />
            <span className="settings-switch__slider" />
          </label>
        </div>

        <div className="settings-switch-row">
          <span>{ui.easyRead}</span>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={prefs.easyReadMode}
              onChange={(event) => setPrefs((prev) => ({ ...prev, easyReadMode: event.target.checked }))}
            />
            <span className="settings-switch__slider" />
          </label>
        </div>

        {error ? <p className="settings-error">{error}</p> : null}
        {success ? <p className="settings-success">{success}</p> : null}

        <button type="button" className="settings-btn settings-btn--primary settings-btn--full" onClick={handleSave} disabled={loading}>
          {loading ? ui.saving : ui.save}
        </button>
      </div>
      </section>
    </Fragment>
  )
}

export default SettingsPreferencesPage
