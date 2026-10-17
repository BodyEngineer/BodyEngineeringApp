import Header from "../components/Header";
import { useOutletContext, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAssessments } from "../services/assessmentService";

export default function AssessmentTimeline() {

    const { openSidebar } = useOutletContext();

    const { id } = useParams();

    const [loading, setLoading] = useState(true);

    const [assessments, setAssessments] = useState([]);

    useEffect(() => {

        loadAssessments();

    }, []);

    async function loadAssessments(){

        try{

            const data = await getAssessments(id);

            setAssessments(data);

        }

        finally{

            setLoading(false);

        }

    }

    return(

        <div className="page">

            <Header

                title="Transformation Timeline"

                subtitle="Track monthly progress"

                onMenuClick={openSidebar}

            />

            {
                loading

                ?

                <p>Loading...</p>

                :

                assessments.map((item)=>(

                    <div
                        key={item.id}
                        className="assessment-card"
                        style={{marginBottom:"18px"}}
                    >

                        <h3>

                            {item.assessment_date}

                        </h3>

                        <p>

                            ⚖️ {item.weight} kg

                        </p>

                        <p>

                            🔥 {item.body_fat}% Body Fat

                        </p>

                    </div>

                ))

            }

        </div>

    );

}