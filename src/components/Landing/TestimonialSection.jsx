import "./TestimonialSection.css";
import { supabase } from "../../lib/supabase";
import { useEffect, useState, useRef } from "react";

export default function TestimonialSection() {
  const [activeIndex, setActiveIndex] = useState(0);
const [reviews, setReviews] = useState([]);

const touchStart = useRef({ x: 0, y: 0 });

const handleTouchStart = (e) => {
  touchStart.current = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
  };
};

const handleTouchEnd = (e) => {
  const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
  const deltaY = e.changedTouches[0].clientY - touchStart.current.y;

  // Only change reviews for intentional horizontal swipes
  if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0) {
      nextReview();
    } else {
      previousReview();
    }
  }
};

  const nextReview = () => {
    setActiveIndex((current) => (current + 1) % reviews.length);
  };

  const previousReview = () => {
    setActiveIndex(
      (current) => (current - 1 + reviews.length) % reviews.length
    );
  };

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data, error } = await supabase
      .from("website_testimonials")
.select("*");
    
      console.log("Error:", error);
      console.log("Data:", data);
    
      if (!error) {
        setReviews(data || []);
      }
    };
  
    fetchTestimonials();
  }, []);
  
  if (reviews.length === 0) {
    return (
      <section className="testimonial-section">
        <h2 style={{ color: "white", textAlign: "center" }}>
          No testimonials found
        </h2>
      </section>
    );
  }
  
  const review = reviews[activeIndex];

  return (
    <section className="testimonial-section" id="reviews">
      <div className="testimonial-container">

        <div className="testimonial-heading">
          <p className="testimonial-label">SUCCESS STORIES</p>

          <h2>
            Real Women.
            <span> Real Transformations.</span>
          </h2>

          <p className="testimonial-subtitle">
            Stories from women who chose to become stronger,
            healthier and more confident.
          </p>

          <div className="google-rating">
            <span className="google-word">
              <span>G</span>oogle Reviews
            </span>

            <span className="rating-stars">★★★★★</span>

            <strong>5.0</strong>
          </div>
        </div>

        <div
  className="testimonial-slider"
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
>

          <button
            className="review-arrow left-arrow"
            onClick={previousReview}
            aria-label="Previous review"
          >
            ‹
          </button>

          <div className="review-card" key={activeIndex}>

            <div className="review-top">
            <div className="review-avatar">
  {review.photo_url ? (
    <img
      src={review.photo_url}
      alt={review.name}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "50%",
      }}
    />
  ) : (
    review.name?.charAt(0).toUpperCase()
  )}
</div>

              <div className="review-person">
                <h3>{review.name}</h3>
                <span>Body Engineering Client</span>
              </div>

              <div className="google-icon">G</div>
            </div>

            <div className="review-stars">
              {"★".repeat(review.rating || 5)}
            </div>

            <p className="review-text">
              “{review.review}”
            </p>

            <div className="verified-review">
              ✓ Verified Client
            </div>

          </div>

          <button
            className="review-arrow right-arrow"
            onClick={nextReview}
            aria-label="Next review"
          >
            ›
          </button>

        </div>

        <div className="review-dots">
          {reviews.map((_, index) => (
            <button
              key={index}
              className={`review-dot ${
                activeIndex === index ? "active" : ""
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show review ${index + 1}`}
            />
          ))}
        </div>

        <div className="testimonial-cta">
        <a
  href="https://www.google.com/search?q=body+engineering+yoga+%26+fitness+studio&rlz=1C5CHFA_enAE1012AE1013&oq=body&gs_lcrp=EgZjaHJvbWUqBggBECMYJzIGCAAQRRg5MgYIARAjGCcyBggCEEUYOzIKCAMQABixAxiABDIKCAQQABixAxiABDIKCAUQABiABBi0BzIHCAYQLhiABDIKCAcQLhixAxiABDIKCAgQABixAxiABDIKCAkQABixAxiABNIBCTUxNzBqMGoxNagCCLACAQ&sourceid=chrome&source=chrome.rb&ie=UTF-8#mpd=~5462891928361395038/customers/reviews"
  target="_blank"
  rel="noopener noreferrer"
  className="google-review-btn"
>
  View All Google Reviews <span>→</span>
</a>
        </div>

      </div>
    </section>
  );
}