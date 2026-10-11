'use client';

import React, { createContext, useContext, useState } from 'react';

interface LoginStepContextType {
  step: 1 | 2 | 3;
  setStep: React.Dispatch<React.SetStateAction<1 | 2 | 3>>;
}

const LoginStepContext = createContext<LoginStepContextType>({
  step: 1,
  setStep: () => {},
});

export function LoginStepProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  return (
    <LoginStepContext.Provider value={{ step, setStep }}>
      {children}
    </LoginStepContext.Provider>
  );
}

export function useLoginStep() {
  return useContext(LoginStepContext);
}
