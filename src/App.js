
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
 
const ADMIN_KEY = 'alfajor2024'
const CATEGORIAS = ['Havanna', 'Kiosco BBB', 'Artesanal']
 
const BADGE_STYLES = {
  'Havanna':    'bg-amber-100 text-amber-800',
  'Kiosco BBB': 'bg-teal-100 text-teal-800',
  'Artesanal':  'bg-rose-100 text-rose-800',
}
 
const CARD_BG = {
  'Havanna':    'from-amber-50 to-orange-50',
  'Kiosco BBB': 'from-teal-50 to-emerald-50',
  'Artesanal':  'from-rose-50 to-pink-50',
}
 
const EMOJI_CAT = {
  'Havanna':    '🏅',
  'Kiosco BBB': '🛒',
  'Artesanal':  '🤌',
}
 
function StarRating({ score }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`text-sm ${i <= Math.round(score/2) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  )
}
 
function AlfajorCard({ alfajor, rank, isAdmin, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
 
  return (
    <div className={`relative rounded-[1.5rem] overflow-hidden bg-gradient-to-br ${CARD_BG[alfajor.categoria] || 'from-gray-50 to-gray-100'} border border-white/80 shadow-sm hover:-translate-y-1 transition-transform duration-200`}>
      {rank === 1 && (
        <div className="absolute top-3 right-3 text-xl">🏆</div>
      )}
      {alfajor.foto_url ? (
        <img src={alfajor.foto_url} alt={alfajor.nombre} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 flex items-center justify-center text-5xl">
          {EMOJI_CAT[alfajor.categoria] || '🍫'}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE_STYLES[alfajor.categoria] || 'bg-gray-100 text-gray-700'}`}>
            {alfajor.categoria}
          </span>
          <span className="text-xs text-gray-400 font-medium">#{rank}</span>
        </div>
        <h3 className="font-black text-gray-900 text-base leading-tight mb-1" style={{fontFamily:'Georgia,serif'}}>
          {alfajor.nombre}
        </h3>
        {alfajor.descripcion && (
          <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{alfajor.descripcion}</p>
        )}
        <StarRating score={alfajor.puntaje} />
        <div className="flex items-end justify-between mt-2">
          <div>
            <span className="text-3xl font-black text-gray-900" style={{fontFamily:'Georgia,serif'}}>{alfajor.puntaje}</span>
            <span className="text-xs text-gray-400 ml-0.5">/10</span>
          </div>
          {alfajor.precio && (
            <span className="text-sm text-gray-500 font-medium">${Number(alfajor.precio).toLocaleString('es-AR')}</span>
          )}
        </div>
 
        {isAdmin && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-black/5">
            <button onClick={() => onEdit(alfajor)}
              className="flex-1 py-1.5 rounded-xl text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors">
              ✏️ Editar
            </button>
            {confirmDelete ? (
              <button onClick={() => onDelete(alfajor.id)}
                className="flex-1 py-1.5 rounded-xl text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">
                ¿Confirmar?
              </button>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="flex-1 py-1.5 rounded-xl text-xs font-medium bg-white border border-gray-200 text-red-400 hover:border-red-300 transition-colors">
                🗑️ Borrar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
 
function AdminModal({ onClose, onSaved, editando }) {
  const [form, setForm] = useState({
    nombre: editando?.nombre || '',
    categoria: editando?.categoria || '',
    puntaje: editando?.puntaje || '',
    precio: editando?.precio || '',
    descripcion: editando?.descripcion || '',
  })
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(editando?.foto_url || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
 
  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }))
 
  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }
 
  const submit = async () => {
    if (!form.nombre || !form.categoria || !form.puntaje) {
      setError('Nombre, categoría y puntaje son obligatorios.')
      return
    }
    const puntaje = parseFloat(form.puntaje)
    if (puntaje < 0 || puntaje > 10) {
      setError('El puntaje debe ser entre 0 y 10.')
      return
    }
    setLoading(true)
    setError('')
 
    let foto_url = editando?.foto_url || null
 
    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, fotoFile, { cacheControl: '3600', upsert: false })
 
      if (uploadError) {
        setError('Error al subir la foto: ' + uploadError.message)
        setLoading(false)
        return
      }
 
      const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(fileName)
      foto_url = urlData.publicUrl
    }
 
    const payload = {
      nombre: form.nombre,
      categoria: form.categoria,
      puntaje,
      precio: form.precio ? parseFloat(form.precio) : null,
      descripcion: form.descripcion || null,
      foto_url,
    }
 
    let err
    if (editando) {
      const { error: e } = await supabase.from('alfajores').update(payload).eq('id', editando.id)
      err = e
    } else {
      const { error: e } = await supabase.from('alfajores').insert([payload])
      err = e
    }
 
    setLoading(false)
    if (err) { setError('Error al guardar: ' + err.message); return }
    onSaved()
    onClose()
  }
 
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-gray-900" style={{fontFamily:'Georgia,serif'}}>
            {editando ? 'Editar Alfajor' : 'Nuevo Alfajor'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
 
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre *</label>
            <input className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" placeholder="Ej: Havanna Clásico" value={form.nombre} onChange={e => handle('nombre', e.target.value)} />
          </div>
 
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría *</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {CATEGORIAS.map(c => (
                <button key={c} onClick={() => handle('categoria', c)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${form.categoria === c ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
 
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Puntaje (0-10) *</label>
            <input type="number" min="0" max="10" step="0.1" className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" placeholder="Ej: 8.5" value={form.puntaje} onChange={e => handle('puntaje', e.target.value)} />
          </div>
 
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio en pesos (opcional)</label>
            <input type="number" className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" placeholder="Ej: 2800" value={form.precio} onChange={e => handle('precio', e.target.value)} />
          </div>
 
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción / Notas (opcional)</label>
            <textarea className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" rows={2} placeholder="Ej: Cobertura de chocolate negro, relleno generoso..." value={form.descripcion} onChange={e => handle('descripcion', e.target.value)} />
          </div>
 
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Foto (opcional)</label>
            <div className="mt-1">
              {fotoPreview && (
                <img src={fotoPreview} alt="preview" className="w-full h-32 object-cover rounded-xl mb-2" />
              )}
              <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-amber-300 hover:text-amber-600 cursor-pointer transition-colors">
                <span>📷</span>
                <span>{fotoFile ? fotoFile.name : 'Elegir foto desde tu dispositivo'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFoto} />
              </label>
            </div>
          </div>
 
          {error && <p className="text-red-500 text-xs">{error}</p>}
 
          <button onClick={submit} disabled={loading}
            className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 mt-2">
            {loading ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar Alfajor'}
          </button>
        </div>
      </div>
    </div>
  )
}
 
export default function App() {
  const [alfajores, setAlfajores] = useState([])
  const [filtro, setFiltro] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
 
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === ADMIN_KEY) setIsAdmin(true)
    fetchAlfajores()
  }, [])
 
  const fetchAlfajores = async () => {
    setLoading(true)
    const { data } = await supabase.from('alfajores').select('*').order('puntaje', { ascending: false })
    setAlfajores(data || [])
    setLoading(false)
  }
 
  const handleEdit = (alfajor) => {
    setEditando(alfajor)
    setShowModal(true)
  }
 
  const handleDelete = async (id) => {
    await supabase.from('alfajores').delete().eq('id', id)
    fetchAlfajores()
  }
 
  const handleClose = () => {
    setShowModal(false)
    setEditando(null)
  }
 
  const filtrados = filtro === 'Todos' ? alfajores : alfajores.filter(a => a.categoria === filtro)
 
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
 
        <div className="mb-6">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight" style={{fontFamily:'Georgia,serif'}}>
            Alfajores Tier List
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {alfajores.length} {alfajores.length === 1 ? 'alfajor catado' : 'alfajores catados'}, ordenados por puntaje
          </p>
        </div>
 
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {['Todos', ...CATEGORIAS].map(cat => (
            <button key={cat} onClick={() => setFiltro(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${filtro === cat ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400'}`}>
              {cat}
            </button>
          ))}
          {isAdmin && (
            <button onClick={() => { setEditando(null); setShowModal(true) }}
              className="ml-auto px-4 py-1.5 rounded-full text-sm font-medium bg-amber-400 text-amber-900 hover:bg-amber-300 transition-colors">
              + Agregar
            </button>
          )}
        </div>
 
        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando ranking...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {alfajores.length === 0 ? 'Todavía no hay alfajores cargados.' : 'No hay alfajores en esta categoría.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {filtrados.map((a, i) => (
              <AlfajorCard
                key={a.id}
                alfajor={a}
                rank={i + 1}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
 
      {showModal && (
        <AdminModal
          onClose={handleClose}
          onSaved={fetchAlfajores}
          editando={editando}
        />
      )}
    </div>
  )
}
 
