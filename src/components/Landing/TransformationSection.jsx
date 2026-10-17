import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./TransformationSection.css";

export default function TransformationSection() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransformations() {
      const { data, error } = await supabase
        .from("website_transformations")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error loading transformations:", error);
      } else {
        setClients(data || []);
      }

      setLoading(false);
    }

    fetchTransformations();
  }, []);

  return (
    <section
      id="transformations"
      className="transformations"
    >
      <span className="section-tag">
        REAL RESULTS
      </span>

      <h2>
        Incredible Client
        <span> Transformations</span>
      </h2>

      <p>
        Every transformation tells a story of consistency,
        discipline and confidence.
      </p>

      {loading ? (
        <p>Loading transformations...</p>
      ) : (
        <div className="transformation-grid">
          {clients.map((client) => (
            <div className="transform-card" key={client.id}>
<div className="images">

<div className="transform-image">
  <img
    src={client.before_image_url}
    alt={`${client.name} before transformation`}
  />
  <span className="image-label before-label">
    BEFORE
  </span>
</div>

<div className="transform-image">
  <img
    src={client.after_image_url}
    alt={`${client.name} after transformation`}
  />
  <span className="image-label after-label">
    AFTER
  </span>
</div>

</div>

              <div className="transform-content">
                <h3>{client.name}</h3>

                <p>{client.goal}</p>

                <div className="badge">
                  {client.result}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </section>
  );
}