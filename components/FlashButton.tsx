import React from "react";

interface FlashButtonProps {
  handleFlickerToggle: () => void;
}

const FlashButton: React.FC<FlashButtonProps> = ({ handleFlickerToggle }) => {
  return (
    <div>
      <button className="cursor-pointer " onClick={() => handleFlickerToggle()}>
        ⚡️ Flash
      </button>
    </div>
  );
};

export default FlashButton;
