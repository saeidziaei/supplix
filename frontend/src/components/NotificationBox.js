import React from "react";

const NotificationBox = ({msg}) => {
  return (
    <div className="flex justify-center items-center my-2">
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-lg w-full mx-auto text-center">
        <p className="font-semibold">{msg}</p>
      </div>
    </div>
  );
}
export default NotificationBox;