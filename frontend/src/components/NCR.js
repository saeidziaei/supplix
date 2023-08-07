import { useNavigate } from "react-router-dom";
import "./NCR.css";

export const NCR = () => {
  const nav = useNavigate();
  

  
  return (
    <span className="clickable ncr" onClick={() => {
      nav("/workspace/NCR/task");
    }}>NCR</span>
    
  );
   
};
