import { useContext, useState } from "react"
import "./login.scss"
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./../../firebase";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Login = () => {
  const [error, setError] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const { dispatch } = useContext(AuthContext);

  const handleLogin = (e) => {
    e.preventDefault();

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        dispatch({ type: "LOGIN", payload: user });
        navigate("/");
      })
      .catch((error) => {
        setError(true);
      });
  }
 
  return (
    <div className="login">
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="E-mail" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Пароль" onChange={e => setPassword(e.target.value)} />
        <button class="customBtn" type="submit">Войти</button>
        {error && <span>Неправильный E-mail или пароль</span>}
      </form>
    </div>
  )
}

export default Login