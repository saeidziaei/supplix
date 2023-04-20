import "./User.css";

export default function User({ user, compact = false }) {
    const firstLetter = (word) => (word ? word.charAt(0) : "-");
    const initial = firstLetter(user.given_name) + firstLetter(user.family_name);

    function getColor(initial) {
      
      // Use a hash function to convert the user's initial to an integer between 0 and 999
      const hash = initial
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const index = hash % 10; // Get the last digit of the hash
  
      // Define a list of colors to choose from
      const colors = [
        "#4B825B",
        "#89432F",
        "#E69813",
        "#BA4321",
        "#F012BE",
        "#0F335C",
        "#293F34",
        "#6B5E65",
        "#3A968D",
        "#2A665C",
      ];
  
      // Return the color at the selected index
      return colors[index];
    }
  
    return (
      <>
        <div
          className="round-label"
          style={{ backgroundColor: getColor(initial), color: "white" }}
        >
          {initial}
        </div>
        {!compact && <span>{`   ${user.given_name} ${user.family_name}`}</span>}
      </>
    );

}