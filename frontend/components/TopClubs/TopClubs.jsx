import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import InitialAvatar, { stripRedditPrefix } from "../Avatar/InitialAvatar.jsx";

const API_URL = import.meta.env.VITE_API_URL;

export default function TopClubs() {
  const [topClubs, setTopClubs] = useState([]);
  useEffect(() => {
    async function fetchTopComms() {
      try {
        const res = await axios.get(`${API_URL}/search/top-clubs`, {
          withCredentials: true,
        });
        setTopClubs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Top clubs load error:", err);
      }
    }

    fetchTopComms();
  }, []);

  return (
    <div className="sr-right-column">
      <div className="sr-card">
        <h3>Top Clubs</h3>

        {topClubs.map((c) => (
          <Link to = {`/club/${c.name}`}
            key={c._id}
            className="sr-side-item no-router-click"
            onClick={() => console.log("clicked club:", c.name)}
          >
            <InitialAvatar
              name={c.name}
              iconUrl={
                c?.iconUrl ? `${import.meta.env.VITE_API_URL}${c.iconUrl}` : null
              }
              size={32}
              className="sr-side-icon"
            />
            <div>
              <div className="sr-side-title">
                {stripRedditPrefix(c.name)}
              </div>
              <div className="sr-side-count">
                {Number(c.memberCount || 0).toLocaleString()} members
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
