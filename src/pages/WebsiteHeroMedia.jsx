import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Video,
  Upload,
  Save,
  CheckCircle,
} from 'lucide-react'
import Header from '../components/Header'
import { supabase } from '../lib/supabase'

const BUCKET_NAME = 'website-media'
const HERO_VIDEO_PATH = 'hero/hero-video'

export default function WebsiteHeroMedia() {
  const { openSidebar } = useOutletContext()
  const navigate = useNavigate()

  const [selectedVideo, setSelectedVideo] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [currentVideoUrl, setCurrentVideoUrl] = useState('/body-engineering.mp4')

  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [heroContent, setHeroContent] = useState({
    id: null,
    heading: '',
    subheading: '',
    description: '',
    button_text: '',
  })

  useEffect(() => {
    loadCurrentHeroVideo()
    loadHeroContent()
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const loadCurrentHeroVideo = async () => {
    try {
      const { data, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list('hero', {
          limit: 20,
          sortBy: {
            column: 'updated_at',
            order: 'desc',
          },
        })

      if (listError) {
        console.error('Could not load hero video:', listError)
        return
      }

      const heroFile = data?.find((file) =>
        file.name.startsWith('hero-video.')
      )

      if (!heroFile) {
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`hero/${heroFile.name}`)

      if (publicUrlData?.publicUrl) {
        setCurrentVideoUrl(
          `${publicUrlData.publicUrl}?v=${Date.now()}`
        )
      }
    } catch (loadError) {
      console.error('Error loading hero video:', loadError)
    }
  }

  const loadHeroContent = async () => {
    const { data, error } = await supabase
      .from('website_hero')
      .select('*')
  
    console.log('TABLE DATA:', data)
    console.log('TABLE ERROR:', error)
  
    if (data?.length > 0) {
      console.log('SETTING HERO CONTENT')
      setHeroContent({
        id: data[0].id,
        heading: data[0].heading || '',
        subheading: data[0].subheading || '',
        description: data[0].description || '',
        button_text: data[0].button_text || '',
      })
    }
  }

  useEffect(() => {
   //  console.log('HERO CONTENT STATE:', heroContent)
  }, [heroContent])

const handleVideoChange = (event) => {
  const file = event.target.files?.[0]

  if (!file) return

  setMessage('')
  setError('')

  if (!file.type.startsWith('video/')) {
    setError('Please select a valid video file.')
    event.target.value = ''
    return
  }

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl)
  }

  setSelectedVideo(file)

  const newPreviewUrl = URL.createObjectURL(file)
  setPreviewUrl(newPreviewUrl)

  event.target.value = ''
}

const removeSelectedVideo = () => {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl)
  }

  setSelectedVideo(null)
  setPreviewUrl('')
  setMessage('')
  setError('')
}

const handlePublish = async () => {
  if (!selectedVideo || uploading) return

  try {
    setUploading(true)
    setMessage('')
    setError('')

    const extension =
      selectedVideo.name.split('.').pop()?.toLowerCase() || 'mp4'

    const filePath = `${HERO_VIDEO_PATH}.${extension}`

    // Remove old hero videos first so we always keep one active file.
    const { data: existingFiles, error: listError } =
      await supabase.storage
        .from(BUCKET_NAME)
        .list('hero', {
          limit: 20,
        })

    if (listError) {
      throw listError
    }

    const oldHeroFiles =
      existingFiles
        ?.filter((file) => file.name.startsWith('hero-video.'))
        .map((file) => `hero/${file.name}`) || []

    if (oldHeroFiles.length > 0) {
      const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(oldHeroFiles)

      if (removeError) {
        throw removeError
      }
    }

    // Upload the newly selected hero video.
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, selectedVideo, {
        cacheControl: '3600',
        upsert: true,
        contentType: selectedVideo.type,
      })

    if (uploadError) {
      throw uploadError
    }

    // Get its public URL.
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    if (!publicUrlData?.publicUrl) {
      throw new Error('Could not generate the hero video URL.')
    }

    setCurrentVideoUrl(
      `${publicUrlData.publicUrl}?v=${Date.now()}`
    )

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedVideo(null)
    setPreviewUrl('')

    setMessage(
      'Hero video uploaded and published successfully.'
    )
  } catch (publishError) {
    console.error('Hero video publish error:', publishError)

    setError(
      publishError?.message ||
      'Something went wrong while publishing the video.'
    )
  } finally {
    setUploading(false)
  }
}

const saveHeroContent = async () => {
  const { error } = await supabase
    .from('website_hero')
    .update({
      heading: heroContent.heading,
      subheading: heroContent.subheading,
      description: heroContent.description,
      button_text: heroContent.button_text,
    })
    .eq('id', heroContent.id)

  if (error) {
    alert('Failed to save hero content')
    console.log(error)
  } else {
    alert('Hero content updated successfully')
  }
}

return (
  <div className="page">
    <Header
      title="Hero & Media"
      subtitle="Manage your public website hero video and content"
      onMenuClick={openSidebar}
    />

    <section className="dashboard-section">

      <h1 style={{ color: "yellow" }}>
        TEST HERO CONTENT
      </h1>

      <button
        type="button"
        className="section-link"
        onClick={() => navigate('/website-management')}
        style={{ marginBottom: '24px' }}
      >
        <ArrowLeft size={16} />
        Back to Website Management
      </button>

      <div className="section-header">
        <div>
          <h2 className="section-title">Homepage Hero</h2>

          <p className="text-muted">
            Manage the promotional video displayed on your public homepage.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="alert alert-error"
          style={{ marginBottom: '20px' }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          className="alert alert-success"
          style={{ marginBottom: '20px' }}
        >
          {message}
        </div>
      )}

      <div className="hero-media-admin">

        {/* CURRENT LIVE VIDEO */}

        <div className="hero-media-card">

          <div className="hero-media-card-header">

            <div className="hero-media-icon">
              <Video size={24} />
            </div>

            <div>
              <h3>Current Hero Video</h3>

              <p className="text-muted">
                This video is currently displayed on your homepage.
              </p>
            </div>

          </div>

          <div className="hero-video-preview">
            <video
              key={currentVideoUrl}
              src={currentVideoUrl}
              controls
              muted
            />
          </div>

          <div className="hero-video-status">
            <CheckCircle size={16} />
            <span>Currently Active</span>
          </div>

        </div>

        {/* NEW VIDEO */}

        <div className="hero-media-card">

          <div className="hero-media-card-header">

            <div className="hero-media-icon">
              <Upload size={24} />
            </div>

            <div>
              <h3>Replace Hero Video</h3>

              <p className="text-muted">
                Select and preview a new promotional video before publishing.
              </p>
            </div>

          </div>

          {!previewUrl ? (

            <label className="hero-upload-box">

              <Upload size={40} />

              <h3>Upload New Video</h3>

              <p>
                Choose a video from your device
              </p>

              <span className="btn btn-secondary">
                Choose Video
              </span>

              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/*"
                hidden
                onChange={handleVideoChange}
              />

            </label>

          ) : (

            <div className="hero-new-video">

              <div className="hero-video-preview">

                <video
                  src={previewUrl}
                  controls
                  muted
                />

              </div>

              <div className="hero-selected-file">

                <div>
                  <strong>Selected Video</strong>

                  <p className="text-muted">
                    {selectedVideo?.name}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={removeSelectedVideo}
                  disabled={uploading}
                >
                  Choose Different Video
                </button>

              </div>

            </div>

          )}

          <div className="hero-media-actions">

            <button
              type="button"
              className="btn btn-primary"
              disabled={!selectedVideo || uploading}
              onClick={handlePublish}
            >
              <Save size={18} />

              {uploading
                ? 'Publishing...'
                : 'Save & Publish'}
            </button>

          </div>

          {selectedVideo && !uploading && (

            <p
              className="text-muted"
              style={{ marginTop: '12px' }}
            >
              Preview ready. Click Save & Publish to make this your new hero video.
            </p>

          )}

        </div>

        <div className="hero-media-card">

          <div className="hero-media-card-header">
            <div>
              <h3>Hero Content</h3>
              <p className="text-muted">
                Manage homepage heading and CTA content.
              </p>
            </div>
          </div>

          <p style={{ color: 'yellow', fontSize: '20px' }}>
  {heroContent.heading}
</p>

          <input
            type="text"
            placeholder="Heading"
            value={heroContent.heading || ''}
            onChange={(e) =>
              setHeroContent({
                ...heroContent,
                heading: e.target.value,
              })
            }
          />

          <br /><br />

          <input
            type="text"
            placeholder="Subheading"
            value={heroContent.subheading || ''}
            onChange={(e) =>
              setHeroContent({
                ...heroContent,
                subheading: e.target.value,
              })
            }
          />

          <br /><br />

          <textarea
            placeholder="Description"
            value={heroContent.description || ''}
            onChange={(e) =>
              setHeroContent({
                ...heroContent,
                description: e.target.value,
              })
            }
            rows={4}
            style={{ width: '100%' }}
          />

          <br /><br />

          <input
            type="text"
            placeholder="Button Text"
            value={heroContent.button_text || ''}
            onChange={(e) =>
              setHeroContent({
                ...heroContent,
                button_text: e.target.value,
              })
            }
          />

          <br /><br />

          <button
            className="btn btn-primary"
            onClick={saveHeroContent}
          >
            Save Hero Content
          </button>
        </div>

      </div>

    </section>
  </div>
)
}