import React from "react";

interface FlashButtonProps {
  handleFlickerToggle: () => void;
}

const FlashButton: React.FC<FlashButtonProps> = ({ handleFlickerToggle }) => {
  return <div>FlashButton</div>;
};

export default FlashButton;
