import React, { createContext, useState } from "react";

export const ContestUserContext = createContext();

export const ContestUserProvider = ({ children }) => {

  const [user, setUser] = useState({
    name: "Ahmed Hassan",
    email: "ahmed@example.com"
  });


  return (
    <ContestUserContext.Provider value={{ user, setUser }}>
      {children}
    </ContestUserContext.Provider>
  );
};
