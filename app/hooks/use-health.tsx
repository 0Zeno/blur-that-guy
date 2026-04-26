import { useEffect, useState } from "react";

export function useHealth() {
  const [healthy, setHealthy] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => res.json())
      .then((data) => setHealthy(data.status === "ok"))
      .catch(() => setHealthy(false));
  }, []);

  return healthy;
}
