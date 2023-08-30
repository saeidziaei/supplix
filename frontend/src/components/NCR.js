import { useNavigate } from "react-router-dom";
import "./NCR.css";

export const NCR = ({ label }) => {
  const nav = useNavigate();

  return (
    <span
      className="clickable ncr"
      onClick={() => {
        nav("/workspace/NCR/task");
      }}
    >
      {label || "NCR"}
    </span>
  );
};
