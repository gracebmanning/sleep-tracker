import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
    useEffect(() => {
        supabase
            .from("pre_bed_activities")
            .select("name")
            .order("name")
            .then(({ data, error }) => console.log({ data, error }));
    }, []);

    return (
        <div className="page-container">
            <h1 className="page-header">Home</h1>
        </div>
    );
}
