import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Header from '../components/Header'
import Button from '../components/Button'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function WebsitePrograms() {
  const { openSidebar } = useOutletContext()

  const [loading, setLoading] = useState(true)
const [programs, setprograms] = useState([])
const [showForm, setShowForm] = useState(false)

const [title, setTitle] = useState('')
const [shortDescription, setShortDescription] = useState('')
const [description, setDescription] = useState('')
const [photo, setPhoto] = useState(null)
const [isActive, setIsActive] = useState(true)

const [editingprogram, setEditingprogram] = useState(null)

const fetchprograms = async () => {
    try {
      setLoading(true)
  
      const { data, error } = await supabase
        .from('website_programs')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

        console.log("Admin Programs:", data);
  
      if (error) throw error
  
      setprograms(data || [])
    } catch (err) {
      console.error('Error loading programs:', err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchprograms()
  }, [])

  const handleDeleteprogram = async (program) => {
    const confirmed = window.confirm(
      'Delete "${program.title}"?'
    )
  
    if (!confirmed) return
  
    try {
      if (program.photo_url) {
        const path = program.image_url.split('/program-images/')[1]
  
        if (path) {
          await supabase.storage
            .from('program-images')
            .remove([path])
        }
      }
  
      const { error } = await supabase
        .from('website_programs')
        .delete()
        .eq('id', program.id)
  
      if (error) throw error
  
      fetchprograms()
  
      alert('Deleted successfully')
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  const handleSaveprogram = async () => {
    try {
      if (!title.trim()) {
        alert('Please enter program name')
        return
      }
  
      if (!description.trim()) {
        alert('Please enter description')
        return
      }
  
      let photoUrl = ''

if (photo) {
  const fileName = `${Date.now()}-${photo.name}`

  const { error: uploadError } = await supabase.storage
    .from('program-images')
    .upload(fileName, photo)

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('program-images')
    .getPublicUrl(fileName)

  photoUrl = data.publicUrl
}

      const { error } = await supabase
        .from('website_programs')
        .insert([
          {
            
                title,
                short_description: shortDescription,
                description,
                image_url: photoUrl,
                is_active: isActive,
              
          },
        ])
  
      if (error) throw error
  
      alert('program saved successfully!')
  
      setTitle('')
      setShortDescription('')
      setDescription('')
      setIsActive(true)
      setShowForm(false)
  
      fetchprograms()
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  return (
    <div className="page">
      <Header
        title="Website programs"
        subtitle="Manage programs displayed on your website"
        onMenuClick={openSidebar}
      />

<section className="dashboard-section">

<div className="section-header">
  <div>
    <h2 className="section-title">
      Website programs
    </h2>

    <p className="text-muted">
      Manage client programs.
    </p>
  </div>

  <Button onClick={() => setShowForm(true)}>
    <Plus size={18} />
    Add New
  </Button>
</div>

{showForm && (
  <div
    className="dashboard-card"
    style={{
      marginTop: '24px',
      padding: '24px',
      width: "100%",
border: "1px solid rgba(255,255,255,.08)",
background: "#111",
boxShadow: "0 10px 30px rgba(0,0,0,.35)",
    }}
  >
    <div className="section-header">
      <h3>
        {editingprogram
          ? 'Edit program'
          : 'Add New program'}
      </h3>

      <Button
        onClick={() => {
          setShowForm(false)
          setEditingprogram(null)
          setTitle('')
          setShortDescription('')
          setDescription('')
          setPhoto(null)
          setIsActive(true)
        }}
      >
        Cancel
      </Button>
    </div>

    <div
      style={{
        display: 'grid',
        gap: '20px',
        marginTop: '20px',
      }}
    >
      <input
  className="form-input"
  placeholder="Program Title"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
/>

<input
  className="form-input"
  placeholder="Short Description"
  value={shortDescription}
  onChange={(e) => setShortDescription(e.target.value)}
/>

<div>
  <label className="form-label">
    Program Photo
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
  />
</div>

      <textarea
        className="form-input"
        rows={5}
        placeholder="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

<Button onClick={handleSaveprogram}>
  Save program
</Button>
    </div>
  </div>
)}

</section>

<div style={{ marginTop: '30px' }}>
  {loading ? (
    <p>Loading programs...</p>
  ) : programs.length === 0 ? (
    <p>No programs found.</p>
  ) : (
    <div
      style={{
        display: "grid",
        gap: "24px",
      }}
    >
      {programs.map((program) => (
        <div
          key={program.id}
          className="dashboard-card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
            padding: "32px",
            borderRadius: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "center",
              flex: 1,
            }}
          >
            <img
              src={
                program.image_url ||
                "https://placehold.co/100x100?text=Program"
              }
              alt={program.title}
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "16px",
                objectFit: "cover",
                border: "3px solid #22c55e",
boxShadow: "0 0 18px rgba(34,197,94,.45)",
                flexShrink: 0,
              }}
            />

            <div style={{ flex: 1 }}>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  marginBottom: "8px",
                }}
              >
                {program.title}
              </h3>

              <p
                style={{
                    color: "#22c55e",
                  fontWeight: "600",
                  marginBottom: "12px",
                }}
              >
                {program.short_description}
              </p>

              <div
                style={{
                  margin: "10px 0",
                  fontSize: "18px",
                  color: "#facc15",
                }}
              >
               
              </div>

              <p
                style={{
                  marginTop: "14px",
                  lineHeight: "1.7",
                  color: "#d1d5db",
                }}
              >
                {program.description}
              </p>
            </div>
          </div>

          <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "12px",
            minWidth: "130px",
        }}
          >
            <span
              style={{
                padding: "8px 14px",
                borderRadius: "999px",
                background: program.is_active
                  ? "#15803d"
                  : "#991b1b",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              {program.is_active ? "Active" : "Inactive"}
            </span>

            <Button
              onClick={() => handleDeleteprogram(program)}
              style={{
                background: "#dc2626",
                color: "#fff",
                minWidth: "110px",
              }}
            >
              🗑 Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  )}      
</div>
</div>
  )
}
