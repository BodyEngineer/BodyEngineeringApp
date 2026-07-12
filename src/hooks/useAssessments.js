import { useEffect, useState } from "react";
import { getAssessments } from "../services/assessmentService";

export function useAssessments(onlineMemberId) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (onlineMemberId) {
      loadAssessments();
    }
  }, [onlineMemberId]);

  async function loadAssessments() {
    try {
      const data = await getAssessments(onlineMemberId);
      setAssessments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return {
    assessments,
    loading,
    refresh: loadAssessments,
  };
}