import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Header from '../components/Header'
import Button from '../components/Button'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function WebsiteTestimonials() {
  const { openSidebar } = useOutletContext()

  const [loading, setLoading] = useState(true)
const [testimonials, setTestimonials] = useState([])
const [showForm, setShowForm] = useState(false)

const [name, setName] = useState('')
const [designation, setDesignation] = useState('')
const [review, setReview] = useState('')
const [result, setResult] = useState('')
const [rating, setRating] = useState(5)
const [photo, setPhoto] = useState(null)
const [isActive, setIsActive] = useState(true)

const [editingTestimonial, setEditingTestimonial] = useState(null)

const fetchTestimonials = async () => {
    try {
      setLoading(true)
  
      const { data, error } = await supabase
        .from('website_testimonials')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
  
      if (error) throw error
  
      setTestimonials(data || [])
    } catch (err) {
      console.error('Error loading testimonials:', err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchTestimonials()
  }, [])

  const handleDeleteTestimonial = async (testimonial) => {
    const confirmed = window.confirm(
      `Delete testimonial from ${testimonial.name}?`
    )
  
    if (!confirmed) return
  
    try {
      if (testimonial.photo_url) {
        const path = testimonial.photo_url.split('/testimonial-photos/')[1]
  
        if (path) {
          await supabase.storage
            .from('testimonial-photos')
            .remove([path])
        }
      }
  
      const { error } = await supabase
        .from('website_testimonials')
        .delete()
        .eq('id', testimonial.id)
  
      if (error) throw error
  
      fetchTestimonials()
  
      alert('Deleted successfully')
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  const handleSaveTestimonial = async () => {
    try {
      if (!name.trim()) {
        alert('Please enter client name')
        return
      }
  
      if (!review.trim()) {
        alert('Please enter review')
        return
      }
  
      let photoUrl = ''

if (photo) {
  const fileName = `${Date.now()}-${photo.name}`

  const { error: uploadError } = await supabase.storage
    .from('testimonial-photos')
    .upload(fileName, photo)

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('testimonial-photos')
    .getPublicUrl(fileName)

  photoUrl = data.publicUrl
}

      const { error } = await supabase
        .from('website_testimonials')
        .insert([
          {
            name,
            designation,
            review,
            result,
            rating,
            is_active: isActive,
            photo_url: photoUrl,
          },
        ])
  
      if (error) throw error
  
      alert('Testimonial saved successfully!')
  
      setName('')
      setDesignation('')
      setReview('')
      setResult('')
      setRating(5)
      setIsActive(true)
      setShowForm(false)
  
      fetchTestimonials()
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  return (
    <div className="page">
      <Header
        title="Website Testimonials"
        subtitle="Manage testimonials displayed on your website"
        onMenuClick={openSidebar}
      />

<section className="dashboard-section">

<div className="section-header">
  <div>
    <h2 className="section-title">
      Website Testimonials
    </h2>

    <p className="text-muted">
      Manage client testimonials.
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
        {editingTestimonial
          ? 'Edit Testimonial'
          : 'Add New Testimonial'}
      </h3>

      <Button
        onClick={() => {
          setShowForm(false)
          setEditingTestimonial(null)
          setName('')
          setDesignation('')
          setReview('')
          setResult('')
          setRating(5)
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
        placeholder="Client Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="form-input"
        placeholder="Designation"
        value={designation}
        onChange={(e) => setDesignation(e.target.value)}
      />

<div>
  <label className="form-label">
    Client Photo
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
        placeholder="Review"
        value={review}
        onChange={(e) => setReview(e.target.value)}
      />

<Button onClick={handleSaveTestimonial}>
  Save Testimonial
</Button>
    </div>
  </div>
)}

</section>

<div style={{ marginTop: '30px' }}>
  {loading ? (
    <p>Loading testimonials...</p>
  ) : testimonials.length === 0 ? (
    <p>No testimonials found.</p>
  ) : (
    <div
      style={{
        display: "grid",
        gap: "24px",
      }}
    >
      {testimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className="dashboard-card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
            padding: "24px",
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
                testimonial.photo_url ||
                "https://placehold.co/100x100?text=User"
              }
              alt={testimonial.name}
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid #22c55e",
boxShadow: "0 0 18px rgba(34,197,94,.45)",
                flexShrink: 0,
              }}
            />

            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "700",
                }}
              >
                {testimonial.name}
              </h3>

              <p
                style={{
                  margin: "6px 0",
                  color: "#9ca3af",
                }}
              >
                {testimonial.designation || "Fitness Client"}
              </p>

              <div
                style={{
                  margin: "10px 0",
                  fontSize: "18px",
                  color: "#facc15",
                }}
              >
                {"⭐".repeat(testimonial.rating || 5)}
              </div>

              {testimonial.result && (
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    borderRadius: "999px",
                    background: "#16a34a",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "12px",
                  }}
                >
                  {testimonial.result}
                </span>
              )}

              <p
                style={{
                  marginTop: "14px",
                  lineHeight: "1.7",
                  color: "#d1d5db",
                }}
              >
                "{testimonial.review}"
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
                background: testimonial.is_active
                  ? "#15803d"
                  : "#991b1b",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              {testimonial.is_active ? "Active" : "Inactive"}
            </span>

            <Button
              onClick={() => handleDeleteTestimonial(testimonial)}
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
