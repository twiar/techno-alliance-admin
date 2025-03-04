import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import List from "./pages/list/List";
import Single from "./pages/single/Single";
import New from "./pages/new/New";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { categoryInputs, productInputs, sectionInputs, userInputs } from "./formSource";
import "./style/dark.scss";
import { useContext } from "react";
import { DarkModeContext } from "./context/darkModeContext";
import { AuthContext } from "./context/AuthContext";

function App() {
  const { darkMode } = useContext(DarkModeContext);

  const { currentUser } = useContext(AuthContext);

  const RequireAuth = ({ children }) => {
    return currentUser ? (children) : <Navigate to="/login" /> 
  }

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <BrowserRouter>
        <Routes>
          <Route path="/">
            <Route path="login" element={<Login />} />
            <Route index element={
              <RequireAuth>
                <List type="sections" />
              </RequireAuth>
            } />
            <Route path="sections">
              <Route index element={<RequireAuth><List type="sections" /></RequireAuth>} />
              <Route path=":sectionId">
                <Route path="categories">
                  <Route index element={<RequireAuth><List inputs={sectionInputs} type="categories" /></RequireAuth>} />
                  <Route path=":categoryId">
                    <Route path="products">
                      <Route index element={<RequireAuth><List inputs={categoryInputs} type="products" /></RequireAuth>} />
                      <Route path=":productId" element={<RequireAuth><Single type="products" /></RequireAuth>} />
                      <Route
                        path="new"
                        element={<RequireAuth><New inputs={productInputs} title="Добавить новый продукт" /></RequireAuth>}
                      />
                    </Route>
                  </Route>
                  <Route
                    path="new"
                    element={<RequireAuth><New inputs={categoryInputs} title="Добавить новую категорию" /></RequireAuth>}
                  />
                </Route>
              </Route>
              <Route
                path="new"
                element={<RequireAuth><New inputs={sectionInputs} title="Добавить новый раздел" /></RequireAuth>}
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
