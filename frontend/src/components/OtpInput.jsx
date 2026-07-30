import { useState, useRef, useEffect } from "react";

function OtpInput({ length = 6, onChange }) {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus the first input on load
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Take only the last digit (in case of double input)
    const val = value.substring(value.length - 1);
    newOtp[index] = val;
    setOtp(newOtp);

    // Call parent onChange
    const combinedOtp = newOtp.join("");
    onChange(combinedOtp);

    // Auto-focus next input if value entered
    if (val && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Focus previous input on Backspace if current value is empty
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < length; i++) {
        if (pastedData[i]) {
          newOtp[i] = pastedData[i];
        }
      }
      setOtp(newOtp);
      onChange(newOtp.join(""));

      // Focus the last filled input
      const lastIndex = Math.min(pastedData.length - 1, length - 1);
      if (inputRefs.current[lastIndex]) {
        inputRefs.current[lastIndex].focus();
      }
    }
  };

  return (
    <div className="otp-split-container">
      <style>{`
        .otp-split-container {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin: 1.5rem 0;
        }

        .otp-digit-input {
          width: 50px;
          height: 56px;
          font-size: 1.5rem;
          font-weight: 700;
          text-align: center;
          border: 2px solid var(--border, #cbd5e1);
          border-radius: var(--radius-sm, 8px);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-main, #0f172a);
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-sm);
        }

        .otp-digit-input:focus {
          border-color: var(--primary, #ff6b35);
          background: var(--surface, #ffffff);
          box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.2), 0 4px 10px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
        }

        /* Dark mode inputs adjustments if surface is light */
        .otp-digit-input::placeholder {
          color: var(--text-muted, #94a3b8);
          opacity: 0.3;
        }
        
        @media (max-width: 480px) {
          .otp-digit-input {
            width: 42px;
            height: 48px;
            font-size: 1.3rem;
          }
          .otp-split-container {
            gap: 8px;
          }
        }
      `}</style>

      {otp.map((digit, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength="1"
          value={digit}
          ref={(el) => (inputRefs.current[index] = el)}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="otp-digit-input"
          placeholder="-"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}

export default OtpInput;
