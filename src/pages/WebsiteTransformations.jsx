import { useOutletContext, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Images, Pencil, Trash2 } from 'lucide-react'
import Header from '../components/Header'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'

export default function WebsiteTransformations() {
    const { openSidebar } = useOutletContext()
    const navigate = useNavigate()
    const [showAddForm, setShowAddForm] = useState(false)
    const [transformations, setTransformations] = useState([])
const [loading, setLoading] = useState(true)

const fetchTransformations = async () => {
  try {
    setLoading(true)

    const { data, error } = await supabase
      .from('website_transformations')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error

    setTransformations(data || [])
  } catch (error) {
    console.error('Error loading transformations:', error)
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  fetchTransformations()
}, [])

    const [name, setName] = useState('')
const [goal, setGoal] = useState('')
const [result, setResult] = useState('')
const [editingTransformation, setEditingTransformation] = useState(null)
const [beforePhoto, setBeforePhoto] = useState(null)
const [afterPhoto, setAfterPhoto] = useState(null)
const [isActive, setIsActive] = useState(true)

const handleSaveTransformation = async () => {
  try {
    if (!name.trim()) {
      alert('Please enter the client name.')
      return
    }

  // EDIT MODE
if (editingTransformation) {
  let beforeImageUrl = editingTransformation.before_image_url
  let afterImageUrl = editingTransformation.after_image_url

  const timestamp = Date.now()

  // Replace BEFORE photo only if a new one is selected
  if (beforePhoto) {
    const beforePath =
      `${timestamp}-before-${beforePhoto.name}`

    const { error: beforeUploadError } =
      await supabase.storage
        .from('website_transformations')
        .upload(beforePath, beforePhoto)

    if (beforeUploadError) {
      throw beforeUploadError
    }

    const { data: beforeUrlData } =
      supabase.storage
        .from('website_transformations')
        .getPublicUrl(beforePath)

    beforeImageUrl = beforeUrlData.publicUrl
  }

  // Replace AFTER photo only if a new one is selected
  if (afterPhoto) {
    const afterPath =
      `${timestamp}-after-${afterPhoto.name}`

    const { error: afterUploadError } =
      await supabase.storage
        .from('website_transformations')
        .upload(afterPath, afterPhoto)

    if (afterUploadError) {
      throw afterUploadError
    }

    const { data: afterUrlData } =
      supabase.storage
        .from('website_transformations')
        .getPublicUrl(afterPath)

    afterImageUrl = afterUrlData.publicUrl
  }

  // Update database
  const { error } = await supabase
    .from('website_transformations')
    .update({
      name: name.trim(),
      goal: goal.trim(),
      result: result.trim(),
      before_image_url: beforeImageUrl,
      after_image_url: afterImageUrl,
      is_active: isActive,
    })
    .eq('id', editingTransformation.id)

  if (error) throw error

  alert('Transformation updated successfully!')

  setEditingTransformation(null)
  setName('')
  setGoal('')
  setResult('')
  setBeforePhoto(null)
  setAfterPhoto(null)
  setIsActive(true)
  setShowAddForm(false)

  await fetchTransformations()
  return
}

    // ADD MODE
    if (!beforePhoto || !afterPhoto) {
      alert('Please select both Before and After photos.')
      return
    }

    const timestamp = Date.now()
  
      // Upload BEFORE photo
      const beforePath = `${timestamp}-before-${beforePhoto.name}`
  
      const { error: beforeUploadError } = await supabase.storage
        .from('website_transformations')
        .upload(beforePath, beforePhoto)
  
      if (beforeUploadError) throw beforeUploadError
  
      // Upload AFTER photo
      const afterPath = `${timestamp}-after-${afterPhoto.name}`
  
      const { error: afterUploadError } = await supabase.storage
        .from('website_transformations')
        .upload(afterPath, afterPhoto)
  
      if (afterUploadError) throw afterUploadError
  
      // Get public image URLs
      const { data: beforeUrlData } = supabase.storage
        .from('website_transformations')
        .getPublicUrl(beforePath)
  
      const { data: afterUrlData } = supabase.storage
        .from('website_transformations')
        .getPublicUrl(afterPath)
  
      // Save transformation details
      const { error: insertError } = await supabase
        .from('website_transformations')
        .insert({
          name: name.trim(),
          goal: goal.trim(),
          result: result.trim(),
          before_image_url: beforeUrlData.publicUrl,
          after_image_url: afterUrlData.publicUrl,
          is_active: isActive,
          display_order: 0,
        })
  
      if (insertError) throw insertError
  
      alert('Transformation saved successfully!')
  
      setName('')
      setGoal('')
      setResult('')
      setBeforePhoto(null)
      setAfterPhoto(null)
      setIsActive(true)
      setShowAddForm(false)
      await fetchTransformations()
    } catch (error) {
      console.error('Error saving transformation:', error)
      alert(error.message || 'Failed to save transformation.')
    }
  }

  const handleToggleStatus = async (transformation) => {
    try {
      const newStatus = !transformation.is_active
  
      const { error } = await supabase
        .from('website_transformations')
        .update({
          is_active: newStatus,
        })
        .eq('id', transformation.id)
  
      if (error) throw error
  
      await fetchTransformations()
    } catch (error) {
      console.error('Error updating transformation:', error)
      alert(error.message || 'Failed to update transformation.')
    }
  }

  const handleDeleteTransformation = async (transformation) => {
    try {
      const confirmed = window.confirm(
        `Delete ${transformation.name}'s transformation?\n\nThis action cannot be undone.`
      )
  
      if (!confirmed) return
  
      // Extract storage file path from a Supabase public URL
      const getStoragePath = (publicUrl) => {
        if (!publicUrl) return null
      
        const marker = '/storage/v1/object/public/website_transformations/'
      
        const index = publicUrl.indexOf(marker)
      
        if (index === -1) return null
      
        return publicUrl.substring(index + marker.length)
      }
  
      const beforePath = getStoragePath(
        transformation.before_image_url
      )
  
      const afterPath = getStoragePath(
        transformation.after_image_url
      )
  
      // Delete images from Supabase Storage
      const filesToDelete = [
        beforePath,
        afterPath,
      ].filter(Boolean)
  
      if (filesToDelete.length > 0) {
        const { data, error: storageError } = await supabase.storage
  .from('website_transformations')
  .remove(filesToDelete)

console.log("Files to delete:", filesToDelete)
console.log("Storage response:", data)
console.log("Storage error:", storageError)

if (storageError) throw storageError
      }
  
      // Delete transformation from database
      const { error: deleteError } = await supabase
        .from('website_transformations')
        .delete()
        .eq('id', transformation.id)
  
      if (deleteError) throw deleteError
  
      await fetchTransformations()
  
      alert('Transformation deleted successfully!')
    } catch (error) {
      console.error(
        'Error deleting transformation:',
        error
      )
  
      alert(
        error.message ||
          'Failed to delete transformation.'
      )
    }
  }

  return (
    <div className="page">
      <Header
        title="Website Transformations"

        onMenuClick={openSidebar}
      />

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <button
              type="button"
              className="section-link"
              onClick={() => navigate('/website-management')}
              style={{ marginBottom: '16px' }}
            >
              <ArrowLeft size={16} />
              Back to Website Management
            </button>

            {editingTransformation ? (
  <>
    <h2 className="section-title">
      Edit Transformation
    </h2>

    <p className="text-muted">
      Update client details or replace transformation photos.
    </p>
  </>
) : (
  <>
 
  </>
)}
          </div>

          {!editingTransformation && !showAddForm && (
  <div className="add-transformation-panel">
    <div>
      <h3>Add New Transformation</h3>
      <p>
        Add a new client before & after transformation story.
      </p>
    </div>

    <Button onClick={() => setShowAddForm(true)}>
      <Plus size={18} />
      Add New
    </Button>
  </div>
)}
        </div>
        {showAddForm && (
  <div
    className="dashboard-card"
    style={{
      marginTop: '24px',
      display: 'block',
      padding: '24px',
    }}
  >
    <div className="section-header">
      <div>
        
      </div>

      <Button
  onClick={() => {
    setShowAddForm(false)
    setEditingTransformation(null)
    setName('')
    setGoal('')
    setResult('')
    setBeforePhoto(null)
    setAfterPhoto(null)
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
        marginTop: '24px',
      }}
    >
      <div>
        <label>Client Name</label>
        <input
  type="text"
  placeholder="Enter client name"
  className="form-input"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
      </div>

      <div>
        <label>Goal</label>
        <input
  type="text"
  placeholder="Example: Fat Loss"
  className="form-input"
  value={goal}
  onChange={(e) => setGoal(e.target.value)}
/>
      </div>

      <div>
        <label>Result</label>
        <input
  type="text"
  placeholder="Example: 12kg Loss"
  className="form-input"
  value={result}
  onChange={(e) => setResult(e.target.value)}
/>
      </div>

      <div className="transformation-photo-edit-grid">

  <div>
    <label>Before Photo</label>

    {editingTransformation?.before_image_url && (
      <div className="transformation-current-photo">
        <span>Current Before</span>

        <img
          src={editingTransformation.before_image_url}
          alt="Current before transformation"
        />
      </div>
    )}

    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="form-input"
      onChange={(e) =>
        setBeforePhoto(e.target.files?.[0] || null)
      }
    />

    {editingTransformation && (
      <p className="text-muted transformation-photo-help">
        Choose a new photo only if you want to replace it.
      </p>
    )}
  </div>

  <div>
    <label>After Photo</label>

    {editingTransformation?.after_image_url && (
      <div className="transformation-current-photo">
        <span>Current After</span>

        <img
          src={editingTransformation.after_image_url}
          alt="Current after transformation"
        />
      </div>
    )}

    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="form-input"
      onChange={(e) =>
        setAfterPhoto(e.target.files?.[0] || null)
      }
    />

    {editingTransformation && (
      <p className="text-muted transformation-photo-help">
        Choose a new photo only if you want to replace it.
      </p>
    )}
  </div>

</div>

      <div>
        <label>
        <input
  type="checkbox"
  checked={isActive}
  onChange={(e) => setIsActive(e.target.checked)}
/>
          {' '}Show this transformation on website
        </label>
      </div>

      <div>
      <Button onClick={handleSaveTransformation}>
  {editingTransformation
    ? 'Update Transformation'
    : 'Save Transformation'}
</Button>
      </div>
    </div>
  </div>
)}

{/* SAVED / UPDATED CLIENT TRANSFORMATIONS */}

<div className="saved-transformations-section">

  <div className="saved-transformations-header">
    <div>
      <h2 className="section-title">
        Client Transformations
      </h2>

      <p className="text-muted">
        Manage all client before & after transformation stories.
      </p>
    </div>

    <span className="saved-transformations-count">
      {transformations.length} Clients
    </span>
  </div>

  <div style={{ marginTop: '24px' }}>
  {loading ? (
    <div className="page-loading">
      <div className="spinner" />
    </div>
  ) : transformations.length === 0 ? (
    <div className="empty-state">
      <Images
        size={42}
        className="empty-state-icon"
      />

      <h3 className="empty-state-title">
        No Transformations Yet
      </h3>

      <p className="empty-state-desc">
        Add your first client transformation to showcase
        their journey on the Body Engineering website.
      </p>
    </div>
  ) : (
    <div className="website-transformations-grid">
      {transformations.map((transformation) => (
        <div
          className="website-transformation-card"
          key={transformation.id}
        >
          <div className="website-transformation-images">

            <div className="website-transformation-photo">
              <span>BEFORE</span>

              <img
                src={transformation.before_image_url}
                alt={`${transformation.name} before`}
              />
            </div>

            <div className="website-transformation-photo">
              <span>AFTER</span>

              <img
                src={transformation.after_image_url}
                alt={`${transformation.name} after`}
              />
            </div>

          </div>

          <div className="website-transformation-info">

            <div className="website-transformation-title-row">

              <div>
                <h3>{transformation.name}</h3>

                {transformation.goal && (
                  <p>{transformation.goal}</p>
                )}
              </div>

              <div className="transformation-status-controls">
  <span
    className={
      transformation.is_active
        ? 'transformation-status active'
        : 'transformation-status hidden'
    }
  >
    {transformation.is_active
      ? 'Published'
      : 'Hidden'}
  </span>

  <button
    type="button"
    className="transformation-toggle-btn"
    onClick={() => handleToggleStatus(transformation)}
  >
    {transformation.is_active
      ? 'Hide from Website'
      : 'Publish'}
  </button>

  <button
  type="button"
  className="transformation-edit-button"
  onClick={() => {
    setEditingTransformation(transformation)
    setName(transformation.name || '')
    setGoal(transformation.goal || '')
    setResult(transformation.result || '')
    setIsActive(transformation.is_active)
    setBeforePhoto(null)
    setAfterPhoto(null)
    setShowAddForm(true)
  
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }}
>
  <Pencil size={13} />
  Edit
</button>

<button
  type="button"
  className="transformation-delete-button"
  onClick={() => handleDeleteTransformation(transformation)}
>
  <Trash2 size={13} />
  Delete
</button>
</div>

            </div>

            {transformation.result && (
              <div className="website-transformation-result">
                {transformation.result}
              </div>
            )}

          </div>
        </div>
      ))}
    </div>
  )}
</div>
</div>
      </section>
    </div>
  )
}