import { useEffect, useMemo, useState } from 'react'
import { fetchCapsules, fetchFriends, type ApiCapsule, type ApiFriendRelation, type ApiUser } from '../services/api.ts'

function getFriendUser(relation: ApiFriendRelation) {
  if (relation.friend && typeof relation.friend !== 'string') return relation.friend
  if (relation.otherUser && typeof relation.otherUser !== 'string') return relation.otherUser
  if (relation.recipient && typeof relation.recipient !== 'string') return relation.recipient
  if (relation.requester && typeof relation.requester !== 'string') return relation.requester
  return null
}

function SearchPage() {
  const [mode, setMode] = useState<'capsules' | 'friends'>('capsules')
  const [query, setQuery] = useState('')
  const [capsules, setCapsules] = useState<ApiCapsule[]>([])
  const [friends, setFriends] = useState<ApiFriendRelation[]>([])

  useEffect(() => {
    const load = async () => {
      const [capsulesResponse, friendsResponse] = await Promise.all([
        fetchCapsules().catch(() => []),
        fetchFriends().catch(() => []),
      ])

      setCapsules(capsulesResponse)
      setFriends(friendsResponse)
    }

    load()
  }, [])

  const filteredCapsules = useMemo(() => {
    if (!query.trim()) return capsules
    const q = query.toLowerCase()
    return capsules.filter((capsule) => `${capsule.title} ${capsule.category || ''}`.toLowerCase().includes(q))
  }, [capsules, query])

  const filteredFriends = useMemo(() => {
    const users = friends
      .map((relation) => getFriendUser(relation))
      .filter((user): user is ApiUser => Boolean(user))

    if (!query.trim()) return users

    const q = query.toLowerCase()
    return users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(q))
  }, [friends, query])

  return (
    <section className="page-layout page-layout--module">
      <article className="page-card">
        <h1>Buscar</h1>
        <p>Explora capsulas y amigos con filtros rapidos.</p>

        <div className="button-row">
          <button type="button" className={mode === 'capsules' ? 'button-primary' : 'button-secondary'} onClick={() => setMode('capsules')}>
            Capsulas
          </button>
          <button type="button" className={mode === 'friends' ? 'button-primary' : 'button-secondary'} onClick={() => setMode('friends')}>
            Amigos
          </button>
        </div>

        <label className="field" htmlFor="search-query">
          <span>Busqueda</span>
          <input
            id="search-query"
            type="text"
            placeholder="Buscar por nombre, categoria o email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </article>

      <article className="page-card">
        <h2>{mode === 'capsules' ? 'Resultados de capsulas' : 'Resultados de amigos'}</h2>
        {mode === 'capsules' ? (
          <ul className="module-list">
            {filteredCapsules.length === 0 ? <li>Sin resultados.</li> : filteredCapsules.map((capsule) => (
              <li key={capsule._id}>{capsule.title}</li>
            ))}
          </ul>
        ) : (
          <ul className="module-list">
            {filteredFriends.length === 0 ? <li>Sin resultados.</li> : filteredFriends.map((friend) => (
              <li key={friend._id}>{friend.name} ({friend.email})</li>
            ))}
          </ul>
        )}
      </article>
    </section>
  )
}

export default SearchPage
